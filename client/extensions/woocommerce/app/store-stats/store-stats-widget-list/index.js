/**
 * External dependencies
 */
import React, { PropTypes, Component } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { find, findIndex, isEqual } from 'lodash';
import { translate, moment } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Table from 'woocommerce/components/table';
import TableRow from 'woocommerce/components/table/table-row';
import TableItem from 'woocommerce/components/table/table-item';
import Card from 'components/card';
import QuerySiteStats from 'components/data/query-site-stats';
import {
	isRequestingSiteStatsForQuery,
	getSiteStatsNormalizedData
} from 'state/stats/lists/selectors';
import StatsModulePlaceholder from 'my-sites/stats/stats-module/placeholder';
import ErrorPanel from 'my-sites/stats/stats-error';
import Sparkline from '../../../components/sparkline';
import Delta from '../../../components/delta';
import { parseUnitPeriods } from 'state/stats/lists/utils';

class StoreStatsWidgetList extends Component {

	static propTypes = {
		data: PropTypes.object.isRequired, // TODO refactor to array :(
		emptyMessage: PropTypes.string,
		selectedDate: PropTypes.string.isRequired,
		siteId: PropTypes.number,
		statType: PropTypes.string,
		query: PropTypes.object.isRequired,
		widgets: PropTypes.array.isRequired,
	};

	state = {
		loaded: false
	};

	componentWillReceiveProps( nextProps ) {
		if ( ! nextProps.requesting && this.props.requesting ) {
			this.setState( { loaded: true } );
		}
		if ( ! isEqual( nextProps.query, this.props.query ) && this.state.loaded ) {
			this.setState( { loaded: false } );
		}
	}

	getEndPeriod = ( date ) => {
		const { unit } = this.props.query;
		return ( unit === 'week' )
			? moment( date ).endOf( 'isoWeek' ).format( 'YYYY-MM-DD' )
			: moment( date ).endOf( unit ).format( 'YYYY-MM-DD' );
	};

	getDeltasBySelectedPeriod = () => {
		return find( this.props.data.deltas, ( item ) =>
			item.period === this.props.selectedDate
		);
	};

	getDeltaByStat = ( stat ) => {
		return this.getDeltasBySelectedPeriod()[ stat ];
	};

	getDeltaSincePeriod = () => {
		const delta = this.getDeltasBySelectedPeriod();
		return parseUnitPeriods( Object.keys( delta )[ 0 ].reference_period );
	}

	getSelectedIndex = ( data ) => {
		return findIndex( data, d => d.period === this.props.selectedDate );
	};

	render() {
		const { selectedDate, siteId, statType, query, data, emptyMessage, widgets } = this.props;
		const selectedIndex = this.getSelectedIndex( data.data );
		const { loaded } = this.state;
		const isLoading = ! loaded && ! ( data && data.length );
		const hasEmptyData = loaded && data && data.length === 0;
		let values = [];
		let titles = null;
		let widgetData = null;
		let widgetList = null;

		if ( ! isLoading && ! hasEmptyData ) {
			values = [
				{
					key: 'title',
					label: translate( 'Stat' )
				},
				{
					key: 'value',
					label: translate( 'Value' )
				},
				{
					key: 'sparkline',
					label: translate( 'Trend' )
				},
				{
					key: 'delta',
					label: `${ translate( 'Since' ) } ${ this.getDeltaSincePeriod().format( 'MMM D' ) }`
				}
			];

			titles = (
				<TableRow isHeader>
					{ values.map( ( value, i ) => {
						return (
							<TableItem
								isHeader
								key={ i }
								isTitle={ 0 === i }
							>
								{ value.label }
							</TableItem>
						);
					} ) }
				</TableRow>
			);

			widgetData = widgets.map( widget => {
				const timeSeries = data.data.map( row => +row[ widget.key ] );
				const delta = this.getDeltaByStat( widget.key );
				return {
					title: widget.title,
					value: timeSeries[ selectedIndex ],
					sparkline: <Sparkline
						aspectRatio={ 3 }
						data={ timeSeries }
						highlightIndex= { selectedIndex }
						maxHeight={ 50 }
					/>,
					delta: <Delta
						value={ `${ Math.abs( Math.round( delta.percentage_change * 100 ) ) }%` }
						className={ `${ delta.favorable } ${ delta.direction }` }
					/>
				};
			} );

			widgetList = (
				<Table header={ titles }>
					{ widgetData.map( ( row, i ) => (
						<TableRow className="store-stats-widget-list__table-row" key={ i }>
							{ values.map( ( value, j ) => (
								<TableItem
									className={ classnames( 'store-stats-widget-list__table-item', value.key ) }
									key={ value.key }
									isTitle={ 0 === j }
								>
									{ row[ value.key ] }
								</TableItem>
							) ) }
						</TableRow>
					) ) }
				</Table>
			);
		}

		return (
			<div>
				{ siteId && statType && <QuerySiteStats statType={ statType } siteId={ siteId } query={ query } /> }
				{ isLoading && <Card><StatsModulePlaceholder isLoading={ isLoading } /></Card> }
				{ ! isLoading && hasEmptyData && <Card><ErrorPanel message={ emptyMessage } /></Card> }
				{ ! isLoading && ! hasEmptyData && widgetList }
			</div>
		);
	}
}

export default connect(
	( state, { siteId, statType, query } ) => {
		return {
			data: getSiteStatsNormalizedData( state, siteId, statType, query ),
			requesting: isRequestingSiteStatsForQuery( state, siteId, statType, query ),
		};
	}
)( StoreStatsWidgetList );
