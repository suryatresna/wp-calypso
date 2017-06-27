/**
 * External dependencies
 */
import debugFactory from 'debug';
import { get } from 'lodash';
import page from 'page';

/**
 * Internal dependencies
 */
import { getSavedPath } from 'lib/restore-last-path';

const debug = debugFactory( 'calypso:restore-last-location' );

function sessionRestore( context, next ) {
	const querystring = get( context, 'querystring', '' );
	if ( querystring.length ) {
		debug( 'cannot restore: has query string' );
		return next();
	}

	getSavedPath()
		.then( ( lastPath ) => {
			debug( 'restoring: ' + lastPath );
			page( lastPath );
			return;
		} )
		.catch( ( reason ) => {
			debug( 'cannot restore', reason );
			//	page.redirect( '/read' );
			next();
		} );
}

function readerFallback() {
	page.redirect( '/read' );
}

export default {
	readerFallback,
	sessionRestore,
};
