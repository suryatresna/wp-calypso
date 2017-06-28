/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { isConnectedSecondaryNetworkSite } from '../';

describe( 'isConnectedSecondaryNetworkSite()', () => {
	it( 'should return false if site items are empty', () => {
		const state = {
			sites: {
				items: {}
			}
		};
		expect( isConnectedSecondaryNetworkSite( state, 1 ) ).be.false;
	} );

	it( 'should return false if siteId is not found', () => {
		const state = {
			sites: {
				items: {
					[ 1 ]: {
						ID: 1,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://example.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					}
				}
			}
		};
		expect( isConnectedSecondaryNetworkSite( state, 2 ) ).be.false;
	} );

	it( 'should return false if siteId is a secondary site but the main site is not part of the state', () => {
		const state = {
			sites: {
				items: {
					[ 2 ]: {
						ID: 2,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://secondary.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					}
				}
			}
		};
		expect( isConnectedSecondaryNetworkSite( state, 2 ) ).be.false;
	} );

	it( 'should return true siteId is a connected secondary site', () => {
		const state = {
			sites: {
				items: {
					[ 1 ]: {
						ID: 1,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://example.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					},
					[ 2 ]: {
						ID: 2,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://secondary.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					}
				}
			}
		};
		expect( isConnectedSecondaryNetworkSite( state, 2 ) ).be.true;
	} );
} );
