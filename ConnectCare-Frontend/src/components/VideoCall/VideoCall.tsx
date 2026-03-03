import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './VideoCall.css';

// Type definition for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}


// Socket.IO server URL - adjust if backend runs on a different port
const SOCKET_URL = import.meta.env.VITE_API_URL;
console.log('VideoCall: SOCKET_URL:', SOCKET_URL);

interface User {
    id: string;
    username: string;
}

interface IncomingCall {
    from: string;
    offer: RTCSessionDescriptionInit;
    username: string;
}

interface VideoCallProps {
    isModal?: boolean;
    localUser?: { id: string; name: string };
    targetUser?: { id: string; name: string };
    onClose?: () => void;
    appointmentId?: string; // Add appointmentId prop
}

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt?: string;
}


const VideoCall: React.FC<VideoCallProps> = ({ isModal, localUser, targetUser, onClose, appointmentId }) => {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Derived state from props or URL or auth
    // If localUser not provided prop, use auth user
    const effectiveLocalUser = localUser || (user ? { id: user.id || 'unknown', name: user.name || user.email || 'User' } : undefined);

    // State
    const [username, setUsername] = useState(effectiveLocalUser?.name || '');
    const [isRegistered, setIsRegistered] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [callStatus, setCallStatus] = useState<string>('Disconnected');
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [mySocketId, setMySocketId] = useState<string>('');
    const [remoteUsername, setRemoteUsername] = useState<string>('Remote User');
    const [currentPeerId, setCurrentPeerId] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    // Check for target and appointment in URL
    const urlTargetId = searchParams.get('targetId');

    const urlTargetName = searchParams.get('targetName'); // Keeping one declaration
    const urlAppointmentId = searchParams.get('appointmentId');
    const effectiveAppointmentId = appointmentId || urlAppointmentId;

    // STT State & Refs
    const [isSttEnabled, setIsSttEnabled] = useState(false);
    const isSttEnabledRef = useRef(false); // Ref to track enabled state in callbacks
    const transcriptBufferRef = useRef<string>('');
    const recognitionRef = useRef<any>(null);

    // Sync ref
    useEffect(() => {
        isSttEnabledRef.current = isSttEnabled;
    }, [isSttEnabled]);


    const effectiveTargetUser = targetUser || (urlTargetId ? { id: urlTargetId, name: urlTargetName || 'Unknown' } : undefined);


    // Refs
    const socketRef = useRef<Socket | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]); // Buffer for early candidates
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isChatOpen]);

    // ICE Servers - EMPTY for local LAN debugging to prevent STUN/IPv6 errors
    const iceServers = {
        iceServers: []
    };

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL);
        const socket = socketRef.current;

        socket.on('connect', () => {
            setCallStatus('Connected to Server');
            setIsSocketConnected(true);
        });

        socket.on('disconnect', () => {
            setCallStatus('Disconnected');
        });

        socket.on('socket-id', (id: string) => {
            setMySocketId(id);
        });

        socket.on('user-joined', (data: { userId: string; username: string; users: User[] }) => {
            setOnlineUsers(data.users);
        });

        socket.on('user-left', (data: { userId: string; users: User[] }) => {
            setOnlineUsers(data.users);
        });

        socket.on('offer', (data: IncomingCall) => {
            setIncomingCall(data);
        });

        socket.on('answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                    // Also process buffered candidates here (for Caller side)
                    await processBufferedCandidates(peerConnectionRef.current);
                } catch (err) {
                    console.error('Error setting remote description:', err);
                }
            }
        });

        socket.on('ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
            console.log('VideoCall: Received remote ICE candidate from', data.from, data.candidate);

            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log('VideoCall: Added remote ICE candidate success', data.candidate.candidate);
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            } else {
                console.log('VideoCall: Buffering ICE candidate (PC not ready or remote desc missing)');
                iceCandidatesBuffer.current.push(data.candidate);
            }
        });

        socket.on('call-declined', () => {
            alert('Call declined');
            cleanupCall();
        });

        // Chat listener
        socket.on('receive-message', (message: any) => {
            const formattedMessage: Message = {
                id: message.id,
                senderId: message.senderId || message.sender_id,
                senderName: message.senderName || message.sender_name,
                content: message.content,
                createdAt: message.createdAt || message.created_at
            };
            setMessages(prev => [...prev, formattedMessage]);
        });

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };
    }, []); // Run once on mount

    // Register user effect - separate to handle async user loading
    useEffect(() => {
        if (effectiveLocalUser && isSocketConnected && !isRegistered) {
            registerUser(effectiveLocalUser.name, effectiveLocalUser.id);
        }

        // Join appointment room if available
        if (isSocketConnected && effectiveAppointmentId && socketRef.current) {
            socketRef.current.emit('join-appointment', effectiveAppointmentId);
            fetchMessages();
        }
    }, [effectiveLocalUser, isRegistered, isSocketConnected, effectiveAppointmentId]);

    const fetchMessages = async () => {
        if (!effectiveAppointmentId) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${effectiveAppointmentId}`);
            if (response.ok) {
                const history = await response.json();
                // Map backend fields to frontend interface if needed (backend snake_case vs camelCase?)
                // Backend: id, appointment_id, sender_id, sender_name, content, created_at
                // Frontend: id, senderId, senderName, content
                const formattedMessages = history.map((m: any) => ({
                    id: m.id,
                    senderId: m.sender_id,
                    senderName: m.sender_name,
                    content: m.content,
                    createdAt: m.created_at
                }));
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };





    // Speech to Text Logic
    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

        if (SpeechRecognitionConstructor) {
            const recognition = new SpeechRecognitionConstructor();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                if (finalTranscript) {
                    transcriptBufferRef.current += finalTranscript;
                    console.log('Transcript buffered:', finalTranscript);
                }
            };

            // Track restart attempts and errors to prevent infinite silent loops
            let restartCount = 0;
            let lastRestart = Date.now();
            let restartTimeout: any = null;
            let lastError: string | null = null;

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                lastError = event.error;
                // For network errors, we don't want to disable STT immediately. 
                // We'll let onend handle the restart logic.
                if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
                    setIsSttEnabled(false);
                    isSttEnabledRef.current = false; // Synchronous update to prevent restart in onend
                    alert(`Speech Recognition Error (${event.error}). Transcription disabled.`);
                } else if (event.error === 'network') {
                    console.warn('STT: Network error detected. Will attempt to restart automatically...');
                    // Don't alert or disable, just log and let onend handle it
                }
            };

            recognition.onend = () => {
                // Restart if enabled (check Ref for current state)
                if (isSttEnabledRef.current && recognitionRef.current) {
                    const now = Date.now();
                    const timeSinceLastRestart = now - lastRestart;

                    if (timeSinceLastRestart < 2000) {
                        restartCount++;
                    } else {
                        restartCount = 0; // Reset if it's been running fine for > 2s
                    }
                    lastRestart = now;

                    if (restartCount > 10) {
                        console.error("Speech recognition ended unexpectedly too many times. Disabling.");
                        setIsSttEnabled(false);
                        isSttEnabledRef.current = false;
                        alert("Live transcription stopped unexpectedly too many times. Disabling to prevent lockup.");
                        return;
                    }

                    // Add a delay before restarting to prevent tight loops during network issues
                    const delay = lastError === 'network' ? 3000 : 1000;
                    console.log(`Recognition ended, restarting in ${delay}ms... (Attempt ${restartCount})`);

                    if (restartTimeout) clearTimeout(restartTimeout);
                    restartTimeout = setTimeout(() => {
                        try {
                            if (isSttEnabledRef.current) {
                                recognitionRef.current.start();
                                lastError = null; // Reset error on successful restart attempt
                            }
                        } catch (e) {
                            console.warn("Failed to restart recognition", e);
                        }
                    }, delay);
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
        };
    }, []);

    // Toggle STT
    useEffect(() => {
        if (recognitionRef.current) {
            if (isSttEnabled) {
                try {
                    recognitionRef.current.start();
                    console.log("STT Started");
                } catch (e) { console.warn("STT START error (already started?)", e); }
            } else {
                try {
                    recognitionRef.current.stop();
                    console.log("STT Stopped manually");
                } catch (e) { }
            }
        }
    }, [isSttEnabled]);

    // Interval to send buffered transcript
    useEffect(() => {
        const interval = setInterval(() => {
            // Check ref.current or state isSttEnabled (state is fine here as it's a dependency)
            if (isSttEnabled && effectiveAppointmentId && transcriptBufferRef.current.trim().length > 0) {
                const textToSend = `[Auto-Transcript]: ${transcriptBufferRef.current}`;

                // Send
                if (socketRef.current) {
                    const msgData = {
                        appointmentId: effectiveAppointmentId,
                        senderId: effectiveLocalUser?.id,
                        senderName: effectiveLocalUser?.name,
                        content: textToSend
                    };
                    socketRef.current.emit('send-message', msgData);
                }

                // Clear buffer
                transcriptBufferRef.current = '';
            }
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [isSttEnabled, effectiveAppointmentId, effectiveLocalUser]);

    // Auto-call effect
    useEffect(() => {

        if (isRegistered && effectiveTargetUser && onlineUsers.length > 0) {
            // Find target user in online list (by userId if available, or name?)
            // The backend storage uses socket ID as key but stores userId.
            // onlineUsers comes from values(users), so it has {id(socket), userId, username}
            const target = onlineUsers.find(u => (u as any).userId === effectiveTargetUser.id || u.username === effectiveTargetUser.name);
            if (target) {
                // Check if already calling?
                // startCall(target.id, target.username); // This might trigger too often
            }
        }
    }, [isRegistered, effectiveTargetUser, onlineUsers]);

    const getMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not access camera/microphone');
            return null;
        }
    };

    const createPeerConnection = (userId: string) => {
        // Cleanup old connection if exists
        if (peerConnectionRef.current) {
            console.warn("Closing existing peer connection before creating new one");
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        const pc = new RTCPeerConnection(iceServers);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Filter out IPv6 candidates for local network stability
                const parts = event.candidate.candidate.split(' ');
                const ip = parts[4];
                if (ip && ip.indexOf(':') !== -1) {
                    console.log('VideoCall: Ignoring IPv6 candidate:', event.candidate.candidate);
                    return;
                }

                console.log('VideoCall: Generated local ICE candidate:', event.candidate.candidate);
                if (socketRef.current) {
                    socketRef.current.emit('ice-candidate', {
                        to: userId,
                        from: mySocketId,
                        candidate: event.candidate
                    });
                }
            } else {
                console.log('VideoCall: End of ICE candidates');
            }
        };

        pc.onicecandidateerror = (event: any) => {
            console.error('VideoCall: ICE Candidate Error:', event);
        };

        pc.onconnectionstatechange = () => {
            console.log('VideoCall: Connection State Change:', pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                // Handle cleanup if needed
                console.log("Connection state change:", pc.connectionState);
            }
            if (pc.connectionState === 'connected') {
                startTimer();
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('VideoCall: ICE Connection State Change:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    // Modified register to accept optional explicit params
    const registerUser = (nameStr: string = username, userIdStr?: string) => {
        if (nameStr.trim() && socketRef.current) {
            // Send object if userId exists
            if (userIdStr) {
                socketRef.current.emit('register-user', { username: nameStr, userId: userIdStr });
            } else {
                socketRef.current.emit('register-user', nameStr);
            }
            setIsRegistered(true);
            getMediaStream();
        }
    };

    const startCall = async (targetSocketId: string, targetUsername: string) => {
        setCurrentPeerId(targetSocketId);
        const pc = createPeerConnection(targetSocketId);
        setRemoteUsername(targetUsername);

        // Clean buffer before starting new call logic
        iceCandidatesBuffer.current = [];

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.emit('offer', {
                    to: targetSocketId,
                    from: mySocketId,
                    offer: offer,
                    username: username
                });
            }
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    };

    const processBufferedCandidates = async (pc: RTCPeerConnection) => {
        if (iceCandidatesBuffer.current.length > 0) {
            console.log(`VideoCall: Processing ${iceCandidatesBuffer.current.length} buffered candidates`);
            for (const candidate of iceCandidatesBuffer.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('VideoCall: Added buffered ICE candidate success');
                } catch (err) {
                    console.error('Error adding buffered ICE candidate:', err);
                }
            }
            iceCandidatesBuffer.current = [];
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !socketRef.current) return;

        const pc = createPeerConnection(incomingCall.from);
        setRemoteUsername(incomingCall.username);
        setCurrentPeerId(incomingCall.from);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            // Process any buffered candidates now that remote description is set
            await processBufferedCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('answer', {
                to: incomingCall.from,
                from: mySocketId,
                answer: answer
            });

            setIncomingCall(null);
        } catch (err) {
            console.error('Error accepting call:', err);
        }
    };

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<any>(null);

    // ... existing refs and useEffects

    // Add end-call listener
    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on('end-call', () => {
            console.log('VideoCall: Received end-call event');
            // If we are already in the process of ending (e.g. doctor triggered it), ignore
            if (isGeneratingReport) return;

            // Instant end for everyone
            cleanupCall();

            // If doctor, they might still want to see the report generation if it was triggered by them?
            // But if the OTHER side ended it, the report generation might not have been triggered yet.
            // Actually, the requirements say "Gets call ended almost instantly with no delay" for both sides.
            // If the patient ends, the doctor should also get the loading screen to see the report? 
            // "just make the call interface dissapear this will make it so once end consultation is clicked, nobody will click it again by mistake"

            if (user?.role === 'doctor') {
                // If remote ended, we still trigger the report generation for the doctor side
                handleDoctorEndFlow();
            } else {
                // Patient side: close immediately
                if (onClose) onClose();
                else window.location.reload();
            }
        });

        return () => {
            socketRef.current?.off('end-call');
        };
    }, [isSocketConnected]); // Re-attach if socket reconnects (or just once if stable)

    // Timer logic
    useEffect(() => {
        if (timeLeft === 0) {
            // Time up
            console.log('VideoCall: Time up!');
            alert('Consultation time finished!');
            forceEndCall();
        }
    }, [timeLeft]);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(600); // 10 minutes
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return 600;
                if (prev <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimeLeft(null);
    };

    const forceEndCall = async () => {
        // Emit end-call to remote immediately for instant termination on their side
        if (socketRef.current && currentPeerId) {
            socketRef.current.emit('end-call', {
                to: currentPeerId,
                from: mySocketId
            });
        }

        if (user?.role === 'doctor') {
            await handleDoctorEndFlow();
        } else {
            // Patient side: close immediately
            cleanupCall();
            if (onClose) onClose();
            else window.location.reload();
        }
    };

    const handleDoctorEndFlow = async () => {
        setIsGeneratingReport(true);

        // Flush any remaining transcript
        if (isSttEnabled && effectiveAppointmentId && transcriptBufferRef.current.trim().length > 0) {
            const textToSend = `[Auto-Transcript]: ${transcriptBufferRef.current}`;
            if (socketRef.current) {
                console.log("Flushing final transcript:", textToSend);
                const msgData = {
                    appointmentId: effectiveAppointmentId,
                    senderId: effectiveLocalUser?.id,
                    senderName: effectiveLocalUser?.name,
                    content: textToSend
                };
                socketRef.current.emit('send-message', msgData);
                transcriptBufferRef.current = ''; // Clear
            }
        }

        // Trigger Report Generation
        if (effectiveAppointmentId) {
            console.log("Triggering AI Report Generation...");
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${effectiveAppointmentId}/ai-reports`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    console.log("Report generation request successful");
                    // Optionally redirect to reports page or reload
                    setTimeout(() => {
                        cleanupCall();
                        if (onClose) onClose();
                        else window.location.reload();
                    }, 2000); // Give a moment for the user to see success if they want
                } else {
                    const errorData = await res.json();
                    console.error("Report generation request failed", errorData);
                    alert(`AI report generation failed: ${errorData.error || 'Unknown error'}. You can retry from the dashboard.`);
                    setIsGeneratingReport(false);
                    cleanupCall();
                    if (onClose) onClose();
                    else window.location.reload();
                }

            } catch (err: any) {
                console.error("Error triggering report:", err);
                alert(`Failed to trigger report generation: ${err.message}.`);
                setIsGeneratingReport(false);
                cleanupCall();
                if (onClose) onClose();
                else window.location.reload();
            }
        } else {
            cleanupCall();
            if (onClose) onClose();
            else window.location.reload();
        }
    };

    // ...


    const declineCall = () => {
        if (!incomingCall || !socketRef.current) return;

        socketRef.current.emit('call-declined', {
            to: incomingCall.from,
            from: mySocketId
        });
        setIncomingCall(null);
    };

    const cleanupCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setRemoteUsername('Remote User');
        setCurrentPeerId(null);
        stopTimer();
    };


    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const findTargetUser = () => {
        if (!effectiveTargetUser) return null;
        // Search by userId first, then username
        return onlineUsers.find(u => (u as any).userId === effectiveTargetUser.id || u.username === effectiveTargetUser.name);
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !socketRef.current || !effectiveAppointmentId) return;

        const msgData = {
            appointmentId: effectiveAppointmentId,
            senderId: effectiveLocalUser?.id,
            senderName: effectiveLocalUser?.name,
            content: newMessage
        };

        socketRef.current.emit('send-message', msgData);
        setNewMessage('');
    };


    return (
        <div className={`video-call-container ${isModal ? 'h-full rounded-none' : ''}`}>
            {!isRegistered && !effectiveLocalUser ? (
                <div className="setup-section">
                    <h2>Join Video Call</h2>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={() => registerUser()}>Join</button>
                </div>
            ) : (
                <div className="video-section">
                    <div className="status-bar">
                        <div className="flex items-center gap-4">
                            <span>Status: {callStatus}</span>
                            <span>Logged in as: <strong>{username}</strong></span>
                            {timeLeft !== null && (
                                <span className={`font-bold text-xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                                    Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            )}
                        </div>
                        {effectiveTargetUser && (
                            <span className="ml-4">
                                Target: <strong>{effectiveTargetUser.name}</strong>
                                {findTargetUser() ? ' (Online)' : ' (Offline)'}
                            </span>
                        )}
                    </div>

                    <div className="main-area">
                        <div className="videos-container">
                            <div className="video-wrapper">
                                <video ref={localVideoRef} autoPlay muted playsInline />
                                <span className="video-label">You ({username})</span>
                            </div>
                            <div className="video-wrapper">
                                <video ref={remoteVideoRef} autoPlay playsInline />
                                <span className="video-label">{remoteUsername}</span>
                            </div>
                        </div>

                        {/* Sidebar: Toggle between Users list and Chat */}
                        {!isChatOpen ? (
                            <div className="sidebar">
                                <div className="sidebar-header">
                                    <span>Online Users</span>
                                    {effectiveAppointmentId && <button onClick={() => setIsChatOpen(true)} className="text-sm text-blue-500">Chat &rarr;</button>}
                                </div>
                                <div className="users-list">
                                    {onlineUsers.filter(u => u.id !== mySocketId).map(user => (
                                        <div key={user.id} className="user-item">
                                            <div className="flex flex-col">
                                                <span>{user.username}</span>
                                                {(user as any).userId && <span className="text-xs text-gray-500">{(user as any).userId}</span>}
                                            </div>
                                            <button className="call-btn" onClick={() => startCall(user.id, user.username)}>Call</button>
                                        </div>
                                    ))}
                                    {onlineUsers.length <= 1 && <div style={{ padding: '1rem', color: '#666' }}>No other users online</div>}
                                </div>
                            </div>
                        ) : (
                            <div className="chat-sidebar">
                                <div className="chat-header">
                                    <span>Chat</span>
                                    <button onClick={() => setIsChatOpen(false)} className="text-sm text-gray-500">&larr; Users</button>
                                </div>
                                <div className="chat-messages" ref={chatContainerRef}>
                                    {messages.map((msg, idx) => {
                                        const myId = String(effectiveLocalUser?.id);
                                        const senderId = String(msg.senderId);
                                        // Debug log only for the first message to avoid spamming validity check
                                        if (idx === messages.length - 1) {
                                            console.log(`VideoCall: Rendering msg from ${senderId} (Me: ${myId}) -> IsOwn: ${senderId === myId}`);
                                        }

                                        const isOwnMessage = senderId === myId;
                                        return (
                                            <div key={msg.id || idx} className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
                                                <span className="message-sender">
                                                    {msg.senderName} {isOwnMessage ? '(You)' : ''}
                                                </span>
                                                {msg.content}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="chat-input-area">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                    />
                                    <button className="chat-send-btn" onClick={sendMessage}>Send</button>
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="controls-bar">
                        <button
                            className={`control-btn ${!isAudioEnabled ? 'active' : ''}`}
                            onClick={toggleAudio}
                            title="Toggle Audio"
                        >
                            {isAudioEnabled ? '🔊' : '🔇'}
                        </button>
                        <button
                            className={`control-btn ${!isVideoEnabled ? 'active' : ''}`}
                            onClick={toggleVideo}
                            title="Toggle Video"
                        >
                            {isVideoEnabled ? '📹' : '🚫'}
                        </button>
                        <button
                            className="bg-red-600 text-white px-3 py-2 rounded-full hover:bg-red-700 transition font-bold"
                            onClick={forceEndCall}
                            title="End Consultation"
                        >
                            End Consultation
                        </button>
                        {effectiveAppointmentId && (
                            <button
                                className={`control-btn ${isChatOpen ? 'active' : ''}`}
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                title="Toggle Chat"
                            >
                                💬
                            </button>
                        )}

                        <button
                            className={`control-btn ${isSttEnabled ? 'active' : ''}`}
                            onClick={() => setIsSttEnabled(!isSttEnabled)}
                            title={isSttEnabled ? "Disable Live Transcription" : "Enable Live Transcription"}
                            style={{ position: 'relative' }}
                        >
                            🎙️
                            {isSttEnabled && <span style={{ position: 'absolute', top: 0, right: 0, fontSize: '0.6rem', background: 'red', borderRadius: '50%', width: '8px', height: '8px' }}></span>}
                        </button>
                    </div>
                </div>
            )}

            {incomingCall && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Incoming Call...</h2>
                        <p>{incomingCall.username} is calling you.</p>
                        <div className="modal-actions">
                            <button className="modal-btn accept" onClick={acceptCall}>
                                <span>✓</span> Accept
                            </button>
                            <button className="modal-btn decline" onClick={declineCall}>
                                <span>✕</span> Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isGeneratingReport && (
                <div className="report-loading-overlay">
                    <div className="report-loading-content">
                        <div className="spinner"></div>
                        <h2>AI generating report....</h2>
                        <p>Please wait, your consultation report is being finalised.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCall;
