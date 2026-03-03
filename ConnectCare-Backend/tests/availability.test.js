const request = require('supertest');
const express = require('express');
const availabilityRoutes = require('../src/routes/availability.routes');
const Availability = require('../src/models/availability.model');

jest.mock('../src/models/availability.model');

// Create a mock auth middleware
jest.mock('../src/middleware/auth.middleware', () => {
    return (req, res, next) => {
        req.user = { id: 1, role: 'doctor' };
        next();
    };
});

const app = express();
app.use(express.json());
// availability routes expects /...
app.use('/api/availability', availabilityRoutes);

describe('Doctor Availability Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/availability', () => {
        it('should add a slot successfully', async () => {
            const mockSlot = { id: 1, doctor_id: 1, start_time: new Date(Date.now() + 86400000), end_time: new Date(Date.now() + 90000000) };
            Availability.addAvailability.mockResolvedValue(mockSlot);

            const res = await request(app)
                .post('/api/availability')
                .send({
                    startTime: new Date(Date.now() + 86400000).toISOString(),
                    endTime: new Date(Date.now() + 90000000).toISOString()
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(Availability.addAvailability).toHaveBeenCalledTimes(1);
        });

        it('should fail if adding slot in the past', async () => {
            const res = await request(app)
                .post('/api/availability')
                .send({
                    startTime: new Date(Date.now() - 86400000).toISOString(),
                    endTime: new Date(Date.now() - 82400000).toISOString()
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Cannot add availability in the past');
        });
    });

    describe('GET /api/availability/:doctorId', () => {
        it('should fetch doctor slots successfully', async () => {
            const mockSlots = [{ id: 1, start_time: '2023-10-10T10:00:00.000Z' }];
            Availability.getAvailability.mockResolvedValue(mockSlots);

            const res = await request(app)
                .get('/api/availability/1')
                .query({ startDate: '2023-10-10', endDate: '2023-10-11' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(Availability.getAvailability).toHaveBeenCalledWith('1', '2023-10-10', '2023-10-11');
        });
    });

    describe('DELETE /api/availability/:id', () => {
        it('should delete a slot successfully', async () => {
            Availability.removeAvailability.mockResolvedValue(true);

            const res = await request(app)
                .delete('/api/availability/1');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Availability.removeAvailability).toHaveBeenCalledWith('1', 1); // string from params, number from mock user
        });
    });
});
