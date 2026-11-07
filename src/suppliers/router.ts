import { Router, Request, Response } from 'express';
import { supplierAData, supplierBData } from './mockData';

export const supplierRouter = Router();

supplierRouter.get(['/supplierA/hotels', '/supplier/a/hotels'], (req: Request, res: Response) => {
  if (req.query.fail === 'true') return res.status(503).json({ message: 'Supplier A unavailable' });
  const city = String(req.query.city ?? '');
  return res.json(supplierAData.filter(h => h.city.toLowerCase() === city.toLowerCase()));
});

supplierRouter.get(['/supplierB/hotels', '/supplier/b/hotels'], (req: Request, res: Response) => {
  if (req.query.fail === 'true') return res.status(503).json({ message: 'Supplier B unavailable' });
  const city = String(req.query.city ?? '');
  return res.json(supplierBData.filter(h => h.city.toLowerCase() === city.toLowerCase()));
});
