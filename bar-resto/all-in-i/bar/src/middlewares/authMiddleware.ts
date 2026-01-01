import { Response, Request, NextFunction } from 'express';
import { verifyEncryptedToken } from '../utils/jwt-jwe';

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
                partnerId?: string;
            };
        }
        interface Request {
            context?: {
                ebm_token: string;
                mrc_code?: string;
            };
        }
    }
}

// Define the possible user types
const authType = ['ADMIN','PARTNER_ADMIN','WAITER','MANAGER','CHEF','KITCHEN'] as const;
type AuthType = typeof authType[number]; // This creates a union type of the array values

export function authMiddleware(allowedRoles: AuthType[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // use token from cookies exist or use authorization header by Bearer token
        const token = req.cookies.log_token || req.headers.authorization?.split(' ')[1];
         const ebm_token = (req.headers['ebmtoken'] as string)?.split(' ')[1];
         const mrc_code = (req.headers['mrc-code'] as string)?.trim();
         
        // If no token is found, return unauthorized
        if (!token) {
            return res.status(401).json({ message: 'You`re not authorized to access this resource, please login first' });
        }
        // check X-Platform from header
        // if (!req.headers['x-platform']) {
        //     return res.status(401).json({ message: 'Unauthorized' });
        // }
        const decode = await verifyEncryptedToken(token);        
        if (!decode) {
            return res.status(401).json({ message: 'UnAuthorized for this resource' });
        }
        try {            
            if (!allowedRoles.includes(decode?.user.role as AuthType)) {
                return res.status(403).json({ message: 'You are not authorized to access this resource!!' });
            }
            req.user = {
                id: decode.user.id,
                role: decode.user.role,
                partnerId: decode.user.partnerId,
            }
            req.context = {
                ebm_token: ebm_token
            }
            if(mrc_code) {
                req.context.mrc_code = mrc_code;
            }
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}
