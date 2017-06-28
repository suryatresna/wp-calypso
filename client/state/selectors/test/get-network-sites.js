/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { getNetworkSites } from '../';

describe( 'getNetworkSites()', () => {
	const currentUserState = {
		currentUser: {
			id: 12345678,
			capabilities: {}
		},
		users: {
			items: {
				12345678: {
					primary_blog: 2916288
				}
			}
		}
	};

	it( 'should return an empty array if no sites exist in state', () => {
		const state = {
			...currentUserState,
			sites: {
				items: {}
			}
		};
		expect( getNetworkSites( state, 1 ) ).to.be.an( 'array' ).that.is.empty;
	} );

	it( 'should return an empty array if no secondary sites exist', () => {
		const state = {
			...currentUserState,
			sites: {
				items: {
					2916288: {
						ID: 2916288,
						name: 'WordPress.com Example Blog',
						URL: 'https://example.com',
						jetpack: true,
						options: {
							unmapped_url: 'https://example.com'
						}
					}
				}
			}
		};
		expect( getNetworkSites( state, 3916284 ) ).to.be.an( 'array' ).that.is.empty;
	} );

	it( 'should return an array with secondary sites if they exist', () => {
		const state = {
			...currentUserState,
			sites: {
				items: {
					1: {
						ID: 1,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://example.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					},
					2: {
						ID: 2,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://secondary.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					},
					3: {
						ID: 3,
						is_multisite: true,
						jetpack: true,
						options: {
							unmapped_url: 'https://secondary3.wordpress.com',
							main_network_site: 'https://example.wordpress.com'
						}
					}
				}
			}
		};
		expect( getNetworkSites( state, 1 ) ).to.satisfy( ( secondary ) => secondary[ 0 ].ID === 2 && secondary[ 1 ].ID === 3 );
	} );
} );

