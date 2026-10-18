import { Router } from 'express';
import {
  saveBenchmarkHistory,
  listBenchmarkHistory,
  getBenchmarkHistoryById,
  deleteBenchmarkHistoryById,
} from '../controllers/historyController.js';

export const historyRouter = Router();

historyRouter.post('/', saveBenchmarkHistory);
historyRouter.get('/', listBenchmarkHistory);
historyRouter.get('/:id', getBenchmarkHistoryById);
historyRouter.delete('/:id', deleteBenchmarkHistoryById);

