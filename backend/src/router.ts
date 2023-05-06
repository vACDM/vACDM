import { APIError } from '@shared/errors';
import miscController from './controllers/misc.controller';
import { NextFunction, Request, Response, Router } from 'express';
import pilotController from './controllers/pilot.controller';
import flowController from './controllers/flow.controller';
import airportController from './controllers/airport.controller';
import metaController from './controllers/meta.controller';
import requestloggerUtils from './utils/requestlogger.utils';
import authController from './controllers/auth.controller';
import authMiddleware from './middleware/auth.middleware';

const router = Router();

router.use(requestloggerUtils);

router.get('/version', metaController.getVersion);
router.get('/config', metaController.getPluginConfig);
router.get('/config/plugin', metaController.getPluginConfig);
router.get('/config/frontend', metaController.getFrontendConfig);

router.get('/datafeed', miscController.getDataFeed);
router.get('/datafeed/:callsign', miscController.getDataFeedPilot);
router.get('/datafeed/cid/:cid', miscController.getPilotFromCid);

router.get('/pilots', pilotController.getAllPilots);
router.post('/pilots', pilotController.addPilot);
router.get('/pilots/:callsign', pilotController.getPilot);
router.get('/pilots/:callsign/logs', pilotController.getPilotLogs);
router.delete('/pilots/:callsign', pilotController.deletePilot);
router.patch('/pilots/:callsign', pilotController.updatePilot);

router.patch('/vdgs/:callsign', authMiddleware, pilotController.updatePilot);

router.get('/measures', flowController.getAllMeasures);
router.get('/legacy-measures', flowController.getLegacyMeasures);

router.get('/airports', airportController.getAllAirports);
router.post('/airports', airportController.addAirport);
router.get('/airports/:icao', airportController.getAirport);
router.get('/airports/:icao/blocks', airportController.getAirportBlocks);
router.delete('/airports/:icao', airportController.deleteAirport);
router.patch('/airports/:icao', airportController.updateAirport);

router.get('/auth/login', authController.authUser);
router.get('/auth/logout', authController.logoutUser);
router.get('/auth/profile', authMiddleware, authController.getProfile);

router.get('/test', miscController.test);

router.use((req: Request, res: Response, next: NextFunction) =>
  next(new APIError('Not Found', null, 404))
);

export default router;
