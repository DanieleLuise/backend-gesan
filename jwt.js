import jwt from 'jsonwebtoken';
import cors from "cors";

export function getToken(username) {
    const payload = {
        name: username
    }
    const secret = "mashes123"
    const token = jwt.sign(payload, secret, {
        expiresIn: '1h'
    })
       return token;
};

export function verifyToken(authorization) {
    const token = authorization?.split(' ')[1] || '';
    const secret = "mashes123"
   
        const decoded = jwt.verify(token, secret);
        return decoded.name;
};



