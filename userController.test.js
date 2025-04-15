import jwt from 'jsonwebtoken';
import { generateToken } from './src/controllers/userController';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('generateToken', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const secretKey = process.env.JWT_SECRET;

  it('should generate a valid JWT token', () => {
    const token = generateToken(mockAddress);
    expect(token).toBeDefined();

    // Verify the token
    const decoded = jwt.verify(token, secretKey);
    expect(decoded.address).toBe(mockAddress);
  });

  it('should include an issued at (iat) claim', () => {
    const token = generateToken(mockAddress);
    const decoded = jwt.verify(token, secretKey);
    expect(decoded.iat).toBeDefined();
  });

  it('should set the token to expire in 1 hour', () => {
    const token = generateToken(mockAddress);
    const decoded = jwt.verify(token, secretKey);
    const currentTime = Math.floor(Date.now() / 1000);
    const expectedExpiry = currentTime + 3600; // 1 hour in seconds

    // Check if the expiration time is approximately 1 hour from now
    expect(decoded.exp).toBeGreaterThanOrEqual(currentTime);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry);
  });
}); 