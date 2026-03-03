import React from 'react';
import VideoCall from './VideoCall';

interface VideoCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    localUser: { id: string; name: string };
    targetUser?: { id: string; name: string };
    appointmentId?: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ isOpen, onClose, localUser, targetUser, appointmentId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
                <div className="flex justify-end p-2 bg-gray-900 text-white">
                    <button onClick={onClose} className="text-white hover:text-red-500 font-bold px-4">
                        Close
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <VideoCall
                        isModal={true}
                        localUser={localUser}
                        targetUser={targetUser}
                        onClose={onClose}
                        appointmentId={appointmentId}
                    />
                </div>
            </div>
        </div>
    );
};


export default VideoCallModal;
