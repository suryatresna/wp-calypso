/**
 * Internal dependencies
 */
import debugFactory from 'debug';
import { savePath } from 'lib/restore-last-path';
import { ROUTE_SET } from 'state/action-types';

const debug = debugFactory( 'calypso:restore-last-location' );

export const saveLastLocation = () => {
	return ( next ) => ( action ) => {
		if ( action.type !== ROUTE_SET || ! action.path || ! action.query ) {
			return next( action );
		}

		if ( Object.keys( action.query ).length !== 0 ) {
			return next( action );
		}

		savePath( action.path )
			.then( () => debug( 'saved path: ' + action.path ) )
			.catch( ( reason ) => debug( 'error saving path', reason ) );

		next( action );
	};
};

export default saveLastLocation;
