
var SELECTED_CAT,
  SELECTED_MONTH,
  SELECTED_COUNTY,
  SELECTED_STATE,
  SELECTED_COUNTY,
  GEOG_LEVEL, //nation, state, county
  DEMOS = ['all', 'coc', 'whi'],
  EXPANDED_DEMOS = ['all', 'whi', 'bla', 'lat', 'api', 'nat'],
  COUNTY_IDS;

var IS_MOBILE = $(window).width() < 800 ? true : false;

var parseTime = d3.timeParse('%m/%d/%Y')

                //force D3 to have the right labels on the axis
                //heads up, change this when data updates
var dataMonths = ['2/1/2020', '4/1/2020', '6/1/2020','8/1/2020','10/1/2020']
var tickValues = dataMonths.map(function(d){ return parseTime(d) })

function formatScore(num){
  if (SELECTED_CAT === 'median_credit_score_all'){
    return num
  } else if (SELECTED_CAT === 'median_debt_in_collect_all'){
    return d3.format('$,')(num)
  } else {
    return d3.format('.1f')(num) + '%'
  }
}

// [parseTime('2/1/2020'), parseTime('4/1/2020'), parseTime('6/1/2020'), parseTime('6/1/2020'), parseTime('8/1/2020'), parseTime('10/1/2020')]
var margin = {top: 20, right: 20, bottom: 20, left: 30}

var containerWidth = parseFloat(d3.select('#map-container').style('width')) - margin.left - margin.right;

var mapWidth = parseFloat(d3.select('#map-container').style('width')) ,
    mapRatio = .7,
    mapHeight = mapWidth * mapRatio;

var usMap = d3.select('svg.map')
              .attr('height', mapHeight + 'px')
              .attr('width', mapWidth + 'px');

var mobileShrinkAmt = IS_MOBILE ? 40 : 0

// height 380 width 335
var lineChartDivWidth = parseFloat(d3.select('#line-chart-container').style('width')) - mobileShrinkAmt,
    lineChartRatio = 200/276,//.631,
    lineChartDivHeight = lineChartDivWidth * lineChartRatio;

var lineMargin = {top: 0, right: 25, bottom: 50, left: 45},
    lineChartWidth = lineChartDivWidth - lineMargin.left - lineMargin.right,
    lineChartHeight = lineChartDivHeight - lineMargin.top - lineMargin.bottom //starting guess

var lineChartSvg = d3.select('.state-lines').append('svg')
    .attr('width', lineChartWidth + lineMargin.left + lineMargin.right)
    .attr('height', lineChartHeight + lineMargin.top + lineMargin.bottom)
.append('g')
    .attr('transform', 'translate(' + lineMargin.left + ',' + lineMargin.top + ')')

var axisTickExtender = 20

var lineYAxis = lineChartSvg.append('g')
  .attr('class', 'grid')

var lineXAxis = lineChartSvg.append('g')
      .attr('class','x-axis')
      .attr('transform', 'translate(0,' + (lineChartHeight + 3) + ')')

var x = d3.scaleTime()
  .range([0, lineChartWidth])
  .domain([parseTime(dataMonths[0]), parseTime(dataMonths[dataMonths.length - 1])])

var y = d3.scaleLinear()
  .range([lineChartHeight, 0])

var xAxis = d3.axisBottom(x)
  .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
  .tickValues(tickValues)

var yAxis = d3.axisLeft(y)
  .tickSize(-lineChartWidth - axisTickExtender )
  .ticks(4)
  .tickFormat(function(d, i) {
    //seems like formatScore() should work here, but I must be doing it wrong so for now...
    if (SELECTED_CAT === 'median_credit_score_all'){
      return d
    } else if (SELECTED_CAT === 'median_debt_in_collect_all'){
      return d3.format('$,')(d)
    } else {
      return d3.format('.1f')(d) + '%';
    }
  })

var line = d3.line()
var lilChartLine = d3.line()

var lilChartDivWidth = parseInt(d3.select('#median-credit-and-race-chart').style('width')),
    lilChartAspectRatio = .7,
    lilChartDivHeight = lilChartDivWidth * lilChartAspectRatio;

var lilChartMargin = {top: 0, right: 15, bottom: 30, left: 35},
  lilChartWidth = lilChartDivWidth - lilChartMargin.left - lilChartMargin.right,
  lilChartHeight = lilChartDivHeight - lilChartMargin.top - lilChartMargin.bottom;

var lilChartSvg = d3.select('#median-credit-and-race-chart').append('svg')
  .attr('width', lilChartWidth + lilChartMargin.left + lilChartMargin.right)
  .attr('height', lilChartHeight + lilChartMargin.top + lilChartMargin.bottom)
.append('g')
  .attr('transform',
        'translate(' + lilChartMargin.left + ',' + lilChartMargin.top + ')');

var xLilChart = d3.scaleTime()
  .range([0, lilChartWidth])
  .domain([parseTime(dataMonths[0]), parseTime(dataMonths[dataMonths.length - 1])])

var yLilChart = d3.scaleLinear()
  .range([lilChartHeight, 0])
  .domain([550, 750])//researchers agreed to shrink the domain

var lineLilChart = d3.line().x(function(d){ return xLilChart(parseTime(d.date)) })
  .y(function(d){ return yLilChart(+d.value) })
  .defined(function(d){
    return !isNaN(d.value)
  })


var lilChartYAxisG = lilChartSvg.append('g')
  .attr('class','grid')

var lilChartXAxisG = lilChartSvg.append('g')
      .attr('class','x-axis')
      .attr('transform', 'translate(0,' + lilChartHeight + ')')

var xAxisLilChart = d3.axisBottom(xLilChart)
  .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
  .tickValues(tickValues)

var yAxisLilChart = d3.axisLeft(yLilChart)
  .tickSize(-lilChartWidth - axisTickExtender)
  .ticks(4)

var colorScheme = {
  'nation': {
    'all': '#FDBF11', //yellow
    'whi': '#55B748', //green
    'bla': '#1696D2', //cyan
    'lat': '#EC008B', //magenta
    'api': '#0A4C6A', //navy
    'nat': '#9D9D9D'
  },
  'state': {
    'all': '#FDBF11', //yellow
    'coc': '#55B748', //green
    'whi': '#1696D2', //cyan
    'us-all': '#000000'
  },
  'county': {
    'ct-all': '#FDBF11', //yellow
    'ct-coc': '#55B748', //green,
    'ct-whi': '#1696D2', //cyan
    'us-all': '#000000',
    'st-all': '#9D9D9D'
  }
}

//https://github.com/schnerd/d3-scale-cluster
var clusterScale = d3.scaleCluster();


d3.queue()
  .defer(d3.csv, 'data/formatted/county.csv')
  .defer(d3.csv, 'data/formatted/state.csv')
  .defer(d3.csv, 'data/formatted/us.csv')
  .defer(d3.csv, 'data/dict.csv')
  .defer(d3.csv, 'data/state-county-names.csv')
  .defer(d3.csv, 'data/autocomplete-src2.csv')
  .defer(d3.json, 'https://d3js.org/us-10m.v1.json')
  .await(dataReady);


function dataReady(error, countiesData, statesData, usData, dict, countyLookup, autocompleteSrc, us){

  var countyList = countyLookup.map(function(d){ return d.id })

   SELECTED_CAT = getQueryParam('cat', 'subp_credit_all', ['subp_credit_all', 'debt_in_collect_all', 'median_debt_in_collect_all', 'avg_cc_util_all', 'stud_loan_del_rate_all', 'cc_del_rate_all', 'auto_retail_loan_del_rate_all', 'mortgage_del_rate_all', 'afs_cred_all', 'del_afs_credit_rate_all', ' median_credit_score_all']),
    SELECTED_MONTH = getQueryParam('month','2/1/2020',['2/1/2020','4/1/2020','6/1/2020','8/1/2020','10/1/2020']),
    SELECTED_COUNTY = getQueryParam('county', '', countyList),
    SELECTED_STATE = getQueryParam('state', 'US', stateAbbrevs),
    GEOG_LEVEL = getQueryParam('geog', 'nation', ['nation', 'state', 'county'])

  var countyMap = d3.map(countyLookup, function(d) { return d.id });
  //add demo label to dict and filter
  COUNTY_IDS = countyLookup.map(function(d){ return d.id })
  dict.forEach(function(measure){
    measure['demo'] = measure.value.substring(measure.value.length-3, measure.value.length)
  })

  var menuItems = dict.filter(function(measure){
    return measure['demo'] === 'all'
  })

  //UI STUFF
  d3.select('#dropdown').selectAll('option')
    .data(menuItems)
    .enter()
    .append('option')
    .text(function(d){
      var text
      if (IS_MOBILE){
        text = d.label.substring(0,d.label.length - 5).replace('afs', 'AFS')
        text = text.toLowerCase()
        text = text[0].toUpperCase() + text.substring(1)
      } else {
        text = d.label.substring(0,d.label.length - 5).toLowerCase().replace('afs', 'AFS')
      }
      return text
    })
    .attr('value', function(d){ return d.value })


  $('#dropdown').selectmenu({
    change: function (event, data){
      SELECTED_CAT = this.value
      var text = dict.filter(function(d){ return d.value === SELECTED_CAT })[0].label.split(',')[0]
      d3.selectAll('.dek').text(text)
      prepareDataAndUpdateMap();
      updateTitles();
      //change width of dropdown to fit new text
      if (!IS_MOBILE){
        $('#text-measurer').text(text)
        var textWidth = $('#text-measurer').width()
        $('.ui-selectmenu-text').css('width', textWidth + 5 + 'px')
        $('#dropdown-button').css('width', textWidth + 50 + 'px')
      }

      if ( GEOG_LEVEL === 'nation' ){
        usLineChart();
      } else if ( GEOG_LEVEL === 'state' ){
        stateLineChart();
      } else {
        countyLineChart();
      }
    }
  })

  if (IS_MOBILE){
    makeMobileMenu()
  }

  function makeMobileMenu(){
    var states = autocompleteSrc.filter(function(d){
      return d.id.length < 3
    })

    states.unshift({id: 'US', text: 'United States'})

    d3.select('#mobile-state-dropdown').selectAll('option')
      .data(states)
      .enter()
      .append('option')
      .text(function(d){ return d.text })
      .attr('value', function(d){ return d.id })

    $('#mobile-state-dropdown').selectmenu({
      change: function(evt,data){
        getPlaceFromTagLookup(evt);
        makeCountyMenu();
      }
    })

    $('#mobile-county-dropdown').selectmenu({
      change: function(evt,data){
        getPlaceFromTagLookup(evt);
      }
    })

    $('#mobile-county-dropdown-button').css('opacity', 0.5 )

    function makeCountyMenu(){
      var counties = countiesData.filter(function(d){ return d.date === SELECTED_MONTH && !isNaN(+d['subp_credit_coc']) && d.place.substring(0,2) === nameFips[SELECTED_STATE] })
      var stateFips = $('#mobile-state-dropdown').val();

      d3.select('#mobile-county-dropdown').selectAll('option').remove();

      d3.select('#mobile-county-dropdown').selectAll('option')
        .data(counties)
        .enter()
        .append('option')
        .text(function(d){ return countyMap.get(d.place).county })
        .attr('value', function(d){ return d.place })
      $('#mobile-county-dropdown').selectmenu('refresh')
      $('#mobile-county-dropdown-button').css('opacity', 1)
    }


  }

  $('#dropdown').val(SELECTED_CAT);
  $('#dropdown').selectmenu('refresh');

  $('.stateCountySearch').select2({
    data: autocompleteSrc,
    placeholder: 'Search for your state or county'
  });

  $('.stateCountySearch').on('select2:select', function(evt){
    getPlaceFromTagLookup(evt);
  })

  $('.stateCountySearch').on('select2:unselect', function(evt){
    var removed = evt.params.data.id;
    //removing a county
    if (removed.length > 2){
      GEOG_LEVEL = 'state'
      d3.selectAll('.counties').classed('selected', false)
      $('#readout > li.county > span.place').text('')
      $('#readout > li.county > span.pct').text('')
      $('#readout > li').removeClass('mouse-mate')
      $('#readout > li.state').addClass('mouse-mate')
      stateLineChart();
    } else {
      //removing a state also removes a county and resets teh whole thing, just like zoombtn
      projection.fitExtent([[0,0],[mapWidth,mapHeight]], featureCollection)
               // resize the map
      usMap.selectAll('.counties').attr('d', path);
      usMap.selectAll('.state-outlines').attr('d', path);
      //reset geographic stuff to default
      GEOG_LEVEL = 'nation'
      SELECTED_STATE = 'US'
      SELECTED_COUNTY = ''
      $('#readout > li.county > span.place').text('')
      $('#readout > li.county > span.pct').text('')
      $('#readout > li.state > span.place').text('')
      $('#readout > li.state > span.pct').text('')
      d3.selectAll('path.state-outlines').attr('stroke', '#FFFFFF').attr('stroke-width', 2)
      d3.select('.counties.selected').classed('selected', false)
      usLineChart();
      updateTitles();

      $('.stateCountySearch').empty().select2({
          data: autocompleteSrc,
          placeholder: 'Search for your state or county',
          multiple: true,
          maximumSelectionLength: 2
      });
    }
  })

  $('.zoom-btn-wrapper').on('click', function(d){
      projection.fitExtent([[0,0],[mapWidth,mapHeight]], featureCollection)
               // resize the map
      usMap.selectAll('.counties').attr('d', path);
      usMap.selectAll('.state-outlines').attr('d', path);
      //reset geographic stuff to default
      GEOG_LEVEL = 'nation'
      SELECTED_STATE = 'US'
      SELECTED_COUNTY = ''
      $('#readout > li.county > span.place').text('')
      $('#readout > li.county > span.pct').text('')
      $('#readout > li.state > span.place').text('')
      $('#readout > li.state > span.pct').text('')
      d3.selectAll('path.state-outlines').attr('stroke', '#FFFFFF').attr('stroke-width', 2)
      d3.select('.counties.selected').classed('selected', false)
      usLineChart();
      updateTitles();

      $('.stateCountySearch').empty().select2({
          data: autocompleteSrc,
          placeholder: 'Search for your state or county',
          multiple: true
      });
  })

  var PREVIOUS_SELECTED_MONTH
  $('#vertical-timeline > g').on({
    click: function(){
      $('#vertical-timeline > g.clicked').attr('class','unclicked')
      $(this).attr('class','clicked')
      SELECTED_MONTH = $(this).attr('data-month')

      //show selected month as selected on the line chart axis
      d3.selectAll('.tick.selected').classed('selected', false);
      var gPosition = dataMonths.indexOf(SELECTED_MONTH) + 2
      d3.select('div.state-lines > svg > g > g.x-axis > g:nth-child(' + gPosition + ')').classed('selected',true)

      //changing the time only changes which line marker is highlighted, it doesn't redraw the chart
      d3.selectAll('.dot')
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
      prepareDataAndUpdateMap();
      updateTitles();
    },
    mouseenter: function(){
      PREVIOUS_SELECTED_MONTH = SELECTED_MONTH
      SELECTED_MONTH = $(this).attr('data-month')

      d3.select(this).classed('moused', true)

      d3.selectAll('.tick.selected').classed('selected', false);
      var gPosition = dataMonths.indexOf(SELECTED_MONTH) + 2
      d3.select('div.state-lines > svg > g > g.x-axis > g:nth-child(' + gPosition + ')').classed('selected',true)

      //changing the time only changes which line marker is highlighted, it doesn't redraw the chart
      d3.selectAll('.dot')
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
      prepareDataAndUpdateMap();
      updateTitles();

    },
    mouseleave: function(){
      var div = d3.select(this)
      div.classed('moused', false)
      SELECTED_MONTH = PREVIOUS_SELECTED_MONTH
      //if you're mousing out of something you just clicked on don't revert to PREVIOUS_SELECTED_MONTH
      if ( d3.select(this).classed('clicked') ){
        SELECTED_MONTH = div.attr('data-month')
      }
       d3.selectAll('.tick.selected').classed('selected', false);
      var gPosition = dataMonths.indexOf(SELECTED_MONTH) + 2
      d3.select('div.state-lines > svg > g > g.x-axis > g:nth-child(' + gPosition + ')').classed('selected',true)

      //changing the time only changes which line marker is highlighted, it doesn't redraw the chart
      d3.selectAll('.dot')
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })

      prepareDataAndUpdateMap();
      updateTitles();

    }
  })

  $('.timeline-marker-dot').on({
    mouseenter: function(evt){
      var marker = $(this),
        tooltipID = marker.attr('data-note'),
        tooltipHeight = $('#' + tooltipID).outerHeight(),
        arrowWidth = 30;
        $('#' + tooltipID).css({
          top: evt.pageY - tooltipHeight / 2,
          left: evt.pageX + arrowWidth,
          opacity: 0.9
        })

      },
      mouseleave: function(){
        var tooltipID = $(this).attr('data-note');
        $('#' + tooltipID).css({
          opacity: 0
        })
      }
  })

  $('.see-more-btn').on('click', function(d){
    var div = $(this).attr('data-cat');

    if (d3.select(this).classed('see-less')){
      $('#' + div).css('display', 'none')
      $(this).removeClass('see-less')
      $(this).children('span').text('MORE')
    } else {
      $('#' + div).css('display', 'inline-block')
      $(this).children('span').text('LESS')
      $(this).addClass('see-less')
    }
  })

  $('#shareUrlBtn').on('click', function(evt){
    getShareUrl()
  })
  //this is for text that's changed by a click not a mouseover
  function updateTitles(){
    var longMeasureName = dict.filter(function(measure){ return measure.value === SELECTED_CAT })[0].label,
    shortMeasureName = longMeasureName.substring(0,longMeasureName.length - 5).toLowerCase().replace('afs', 'AFS'),
    monthYear = d3.timeFormat('%B %Y')(parseTime(SELECTED_MONTH)),
    placeName ='',
    note = '',
    stateScore = '',
    countyName = '',
    countyScore = '';

    var usNote = '<b>Source:</b> Tabulations of Urban Institute credit bureau data.<br><b>Notes:</b> Communities of color are based on credit records for people who live in zip codes where more than 60 percent of residents identified as people of color (Black, Hispanic, Native American, another race other than white, or multiracial). In the same way, majority-white, Black, Hispanic, and Native communities are zip codes where more than 60 percent of residents identified as the respective racial or ethnic group.',
    stateAndCountyNote = '<b>Notes:</b> Detailed race data are not available for communities that are too small. NA = Native American.'

    if ( GEOG_LEVEL === 'state' ){
      placeName = stateNameLookup[SELECTED_STATE]
      note = stateAndCountyNote
      stateScore = statesData.filter(function(d){
        return d.place === SELECTED_STATE
      })[dataMonths.indexOf(SELECTED_MONTH)][SELECTED_CAT];

      countyName = ''
      countyScore = ''
      $('#readout > li.state > span.place').text(placeName)
      $('#readout > li.state > span.pct').text(formatScore(stateScore))

    } else if ( GEOG_LEVEL === 'county' ){
      countyName = countyMap.get(SELECTED_COUNTY).county
      placeName = countyName + ' County, ' + stateNameLookup[SELECTED_STATE]
      note = stateAndCountyNote

      countyScore = countiesData.filter(function(d){
        return d.date === SELECTED_MONTH
      }).filter(function(d){
          return d.place === SELECTED_COUNTY
      })[0][SELECTED_CAT]

      stateScore = statesData.filter(function(d){
        return d.place === SELECTED_STATE
      })[dataMonths.indexOf(SELECTED_MONTH)][SELECTED_CAT]

      $('#readout > li.state > span.place').text(stateNameLookup[SELECTED_STATE])
      $('#readout > li.state > span.pct').text(formatScore(stateScore))
      $('#readout > li.county > span.place').text(countyName + ' County')
      $('#readout > li.county > span.pct').text(formatScore(countyScore))

    } else {
      placeName = 'the United States'
      note = usNote
      var usScore = usData[dataMonths.indexOf(SELECTED_MONTH)][SELECTED_CAT]
      //again don't understand why formatScore() doesn't work here... so
        if (SELECTED_CAT === 'median_credit_score_all'){
          usScore = usScore
        } else if (SELECTED_CAT === 'median_debt_in_collect_all'){
          usScore = d3.format('$,')(usScore)
        } else {
          usScore = d3.format('.1f')(usScore) + '%'
        }
      $('#readout > li.nation > span.pct').text(usScore)
    }

    $('.title-measure-name').text(capFirstLetter(shortMeasureName))
    $('.map-title-date').text(monthYear)
    $('.line-title-name').text(placeName)
    // $('#line-chart-container > p.chart-note').html(note) // 2/17: We think we're taking this out but not sure

  }



  //DATA PREP


  //get first month's data to set scales (set the scales only once, rather than updating for each new month)
  var febcountiesData = countiesData.filter(function(d){
    if (isNaN(+d[SELECTED_CAT])){ d[SELECTED_CAT] = '' }
    return d.date === '2/1/2020'
  })


  var creditByCountyId = {}
  function prepareDataAndUpdateMap(){
    var selectedCatWithAllSuffix = SELECTED_CAT.substring(0, SELECTED_CAT.length-3) + 'all';

    var monthlycountiesData = countiesData.filter(function(d){
      if (isNaN(+d[selectedCatWithAllSuffix])){ d[selectedCatWithAllSuffix] = '' }
      return d.date === SELECTED_MONTH
    })

    monthlycountiesData.forEach(function(d) {
      creditByCountyId[d.place] = +d[selectedCatWithAllSuffix]
    })
    //set the scale using just 2/2020's data so that scale doesn't with the data, to help with comparison
    clusterScale
      .domain(febcountiesData.map(function(county){ return +county[selectedCatWithAllSuffix] }))
      .range(COLORS.urbanBlue[5])

    updateMapFills();
    updateLegend(clusterScale.clusters());

    if (GEOG_LEVEL !== 'nation'){
      moveMap(nameFips[SELECTED_STATE])
    }

  }

  //MAP

  //https://prodevsblog.com/questions/1603297/scaling-d3-v4-map-to-fit-svg-or-at-all/
   var featureCollection = topojson.feature(us, us.objects.counties);
   var projection = d3.geoIdentity()
          .fitExtent([[0,0],[mapWidth,mapHeight]], featureCollection)

    var path = d3.geoPath().projection(projection)
    var centered
  //just do the basic map once, update fills from menu selection
  //helpful: http://bl.ocks.org/chriscanipe/071984bcf482971a94900a01fdb988fa

  var counties = usMap.append('g')
    .style('cursor', 'pointer')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append('path')
    .attr('class', function(d){ return 'counties c' + d.id })
    .attr('d', path)
    .attr('stroke', 'white')
    .attr('stroke-width', 0.5)
    .on('click', getPlaceFromMap)
    .on('mouseover', function(d){
      var placeHasNoData = checkForData(d)
      if ( placeHasNoData ){
        // d3.evt.preventDefault()
        return
      } else {
        if (GEOG_LEVEL === 'nation'){
          var mousedState = fipsNames[d.id.substring(0,2)],
          stateClass = mousedState.toLowerCase(),
          stateOutline = d3.select('path.state-outlines.' + stateClass);

          stateOutline.attr('stroke', COLORS['yellow'][1]).attr('stroke-width', 3)
          stateOutline.moveToFront();

          var stateAbbrev = fipsNames[d.id]
          var data = statesData.filter(function(d){ return d.place === mousedState });

          $('#readout > li.state').addClass('mouse-mate')
          $('#readout > li.state > span.place').text(stateNameLookup[mousedState])
          $('#readout > li.state > span.pct').text(formatScore(data[data.length - 1][SELECTED_CAT]) )
        } else {

          if (GEOG_LEVEL === 'state'){
            $('#readout > li.state').removeClass('mouse-mate')
            $('#readout > li.county').addClass('mouse-mate')
          }

          var mousedCounty = d3.select(this),
          mousedCountyId = d.id

          if (mousedCountyId.substring(0,2) !== nameFips[SELECTED_STATE] ){
            return
          } else {
            var countyLabel = SELECTED_STATE === 'LA' ? ' Parish' : ' County',
            placeName = countyMap.get(mousedCountyId).county + countyLabel,
            score = countiesData.filter(function(d){
              return d.date === SELECTED_MONTH
            }).filter(function(d){
                return d.place === mousedCountyId
            })[0][SELECTED_CAT]

            mousedCounty.attr('stroke', COLORS['yellow'][1]).attr('stroke-width', 3);
            mousedCounty.moveToFront();

            $('#readout > li.county > span.place').text(placeName)
            $('#readout > li.county > span.pct').text(formatScore(score))
          }
        }
      }

    })
    .on('mouseout', function(d){
      if (GEOG_LEVEL === 'nation'){
        var mousedState = fipsNames[d.id.substring(0,2)],
        stateClass = mousedState.toLowerCase(),
        stateOutline = d3.select('path.state-outlines.' + stateClass);

        stateOutline.attr('stroke', '#FFFFFF').attr('stroke-width', 2)

        d3.select('.counties.selected').moveToFront()

        $('#readout > li.state').removeClass('mouse-mate')
        $('#readout > li.state > span.place').text('')
        $('#readout > li.state > span.pct').text('')
      } else {
        var mousedCounty = d3.select(this)
        mousedCounty.attr('stroke', '#FFFFFF').attr('stroke-width', 1)

        if (GEOG_LEVEL === 'state'){
          $('#readout > li').removeClass('mouse-mate')
          $('#readout > li.state').addClass('mouse-mate')
        }

          $('#readout > li.county > span.place').text('')
          $('#readout > li.county > span.pct').text('')

        if (SELECTED_COUNTY !== '' && GEOG_LEVEL === 'county'){
          var countyLabel = SELECTED_STATE === 'LA' ? ' Parish' : ' County',
          placeName = countyMap.get(SELECTED_COUNTY).county + countyLabel,
          score = countiesData.filter(function(d){
            return d.date === SELECTED_MONTH
          }).filter(function(d){
              return d.place === SELECTED_COUNTY
          })[0][SELECTED_CAT]

          $('#readout > li.county > span.place').text(placeName)
          $('#readout > li.county > span.pct').text(formatScore(score))
        } else {
          $('#readout > li.county > span.place').text('')
          $('#readout > li.county > span.pct').text('')
        }
      }
    })

  var usStates = usMap.append('g')
    .attr('class', 'states-g')
    .selectAll('path')
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append('path')
    .attr('fill', 'none')
    .attr('stroke', '#FFFFFF')
    .attr('class', function(d){ return 'state-outlines ' + classify(fipsNames[d.id])  })
    .attr('stroke-width', 2)
    .attr('d', path)

  if (SELECTED_COUNTY != ''){
    d3.select('.counties.c' + SELECTED_COUNTY).classed('selected', true)
  }

  function updateMapFills(){
    counties.attr('fill', function(d){
      if (!creditByCountyId[d.id]){
        return '#d2d2d2'
      } else {
        return clusterScale(creditByCountyId[d.id])
      }
    })
  }

  function updateLegend(breaks){

    //the map legend
    d3.select('#legend').selectAll('li').remove()
    d3.select('#legend').selectAll('li')
      .data(breaks)
      .enter()
      .append('li')
      .text(function(d){
        // return d3.format(".1f")(d)
        if (SELECTED_CAT === 'median_credit_score_all'){
          return d
        } else if (SELECTED_CAT === 'median_debt_in_collect_all'){
          return d3.format('$,')(d)
        } else {
          return d3.format('.1f')(d) + '%';
        }
      })
      .style('border-left', function(d){ return '20px solid' + clusterScale(d) })
    //add a box for NA
    d3.select('#legend').append('li').text('NA').style('border-left', '20px solid #d2d2d2')
  }

  var tagScootch =
  function(){
    return $('ul.select2-selection__rendered > li:nth-child(1)').outerWidth() +
    parseFloat($('ul.select2-selection__rendered > li:nth-child(2)').css('left')) +
    20 //padding
  }

  function getPlaceFromTagLookup(evt){
    var placeId,
      placeName,
      goToState = '';
    if (IS_MOBILE){
      var theMenuThatSentMe = $(evt.delegateTarget).attr('id')
      theMenuThatSentMe = theMenuThatSentMe.substring(0, theMenuThatSentMe.length-5)
      placeId = $('#' + theMenuThatSentMe).val()
      placeName = $('#' + theMenuThatSentMe).find(':selected').text();
    } else {
      var placeId = evt.params.data.id
      var placeName = evt.params.data.text
    }

    if (IS_MOBILE && placeId === 'US'){
      GEOG_LEVEL = 'nation'
      SELECTED_STATE = 'US'
      SELECTED_COUNTY = ''
      usLineChart();
      updateTitles();

      $('#mobile-county-dropdown').empty();

    } else {
      // input is county
      if ( placeId.length > 2 ){
        GEOG_LEVEL = 'county'
        SELECTED_COUNTY = placeId
        goToState = placeId.substring(0,2);
        SELECTED_STATE = fipsNames[goToState]
        countyLineChart();

              $('#readout > li').removeClass('mouse-mate')
      $('#readout > li.county').addClass('mouse-mate')

        $('.stateCountySearch').val([SELECTED_COUNTY, goToState]).trigger('change')
        $('ul.select2-selection__rendered > li:nth-child(2)').css('left', tagScootch)
      //input is state
      } else {
        GEOG_LEVEL = 'state'
        SELECTED_STATE = fipsNames[placeId]
        goToState = placeId
        stateLineChart();
        filterSearchOptionsToState();
        $('.stateCountySearch').val(goToState).trigger('change')
      }
      d3.selectAll('.counties').classed('selected', false)
      d3.select('.counties.c' + SELECTED_COUNTY).classed('selected', true).moveToFront()
      updateTitles();
      moveMap(goToState)
    }
    //TODO check if this place is missing it's overall cat for any of the measures
    //and disable those options in the main dropdown
  }

  function checkForData(e){
    var placeId = e.id,
      stateFips = placeId.substring(0,2)

    if ( GEOG_LEVEL === 'nation' ){
      //true or false, there's no data for this state
      return statesData.filter(function(d){ return d.place === fipsNames[stateFips] })[dataMonths.indexOf(SELECTED_MONTH)][SELECTED_CAT] === ''
    } else {
      return countiesData.filter(function(d){ return d.place === placeId })[dataMonths.indexOf(SELECTED_MONTH)][SELECTED_CAT] === ''
    }
  }

  function getPlaceFromMap(evt){

    var placeHasNoData = checkForData(evt)
    if ( placeHasNoData ){
      d3.evt.preventDefault()
      return
    } else {
      var stateFips = evt.id.substring(0,2)
      if ( GEOG_LEVEL === 'nation' ){

        GEOG_LEVEL = 'state'
        $('.stateCountySearch').val(stateFips).trigger('change')
        SELECTED_STATE = fipsNames[stateFips]
        moveMap(stateFips);
        stateLineChart();
        filterSearchOptionsToState();
        $('.stateCountySearch').val(stateFips).trigger('change')
      } else if ( GEOG_LEVEL === 'state' || GEOG_LEVEL === 'county' ){

        //because this is also handling regular click event type stuff
        $('#readout > li').removeClass('mouse-mate')
                //because this is also handling regular click event type stuff
        $('#readout > li.county').addClass('mouse-mate')

         //clicking on a different state from state GEOG_LEVEL
        if (fipsNames[stateFips] !== SELECTED_STATE){
          GEOG_LEVEL = 'state'
          SELECTED_STATE = fipsNames[stateFips]
          SELECTED_COUNTY = ''
          $('#readout > li.county > span.place').text('')
          $('#readout > li.county > span.pct').text('')
          filterSearchOptionsToState();
          moveMap(stateFips);
          stateLineChart();
          $('.stateCountySearch').val(stateFips).trigger('change')
        } else { //clicking twice on same state brings you to county level geo
          GEOG_LEVEL = 'county'
          SELECTED_COUNTY = evt.id
          d3.selectAll('.counties').classed('selected', false)
          var mousedCounty = d3.select(this);
          mousedCounty.classed('selected', true)
          mousedCounty.moveToFront();
          countyLineChart();
          $('.stateCountySearch').val([SELECTED_COUNTY, stateFips]).trigger('change')
          $('ul.select2-selection__rendered > li:nth-child(2)').css('left', tagScootch)
        }
      }
      updateTitles();
    }
  }

  function filterSearchOptionsToState(){

    var relevantCounties = countiesData.filter(function(d){
      return d.date === SELECTED_MONTH &&
      !isNaN(+d[SELECTED_CAT]) && d[SELECTED_CAT] !== '' && //some n/a* became "" in teh datasheet :()
      d.place.substring(0,2) === nameFips[SELECTED_STATE]
    })

    // https://stackoverflow.com/questions/32965688/comparing-two-arrays-of-objects-and-exclude-the-elements-who-match-values-into
    var filteredOptions = autocompleteSrc.filter(function (o1) {
        return relevantCounties.some(function (o2) {
            return o1.id === o2.place;
       });
    });
    console.log(filteredOptions)

    $('.stateCountySearch').empty().select2({
      data: filteredOptions,
      multiple: true
    })
  }

  function moveMap(stateFips){

      var d = topojson.feature(us, us.objects.states).features.filter(function(s){ return s.id == stateFips} )[0]

      // maybe rethink this whole thing? the bostock way: https://observablehq.com/@d3/zoom-to-bounding-box
      // challenge here is we have two maps at once, counties and states

      //zoomer from: https://bl.ocks.org/veltman/77679636739ea2fc6f0be1b4473cf03a
      centered = centered !== d && d;

      var statePaths = usMap.selectAll('.state-outlines')
        .classed('active', function(d){ d === centered});

      var countyPaths = usMap.selectAll('.counties')
        .classed('active', function(d){ return d === centered })

      // Starting translate/scale
      var t0 = projection.translate(),
        s0 = projection.scale();

      // Re-fit to destination
      projection.fitSize([mapWidth, mapHeight], centered || d);

      // Create interpolators
      var interpolateTranslate = d3.interpolate(t0, projection.translate()),
          interpolateScale = d3.interpolate(s0, projection.scale());

      var countyInterpolator = function(t) {
        projection.scale(interpolateScale(t))
          .translate(interpolateTranslate(t));
        countyPaths.attr('d', path);
      };

      d3.transition()
        .duration(450)
        .tween('projection', function() {
          return countyInterpolator;
        }).on('end', function(){
          if (GEOG_LEVEL === 'state'){
            stateLineChart();
          } else if (GEOG_LEVEL === 'county'){
            countyLineChart();
          } else {
            usLineChart();
          }

          d3.selectAll('.state-outlines').attr('stroke', '#FFFFFF').attr('stroke-width', 2)
          d3.selectAll('.counties').attr('stroke-width', 1)
          var stateClass = SELECTED_STATE.toLowerCase(),
          stateOutline = d3.select('path.state-outlines.' + stateClass);

          stateOutline.attr('stroke', COLORS['yellow'][1]).attr('stroke-width', 4)
          stateOutline.moveToFront()

          // usMap.append("path")
          //   .datum(topojson.mesh(us, us.objects.states, function(d){ return d.id === stateFips }))
          //   .attr("fill", "none")
          //   .attr("stroke", COLORS.yellow[1])
          //   .attr("class", 'state-outlines')
          //   .attr("stroke-width", 5)
          //   .attr("d", path)

          return statePaths.attr('d', path)
        });
  }


  //LINE CHARTS
  function setYDomain(data){
    if (SELECTED_CAT === 'median_credit_score_all'){
      return y.domain([550,750])
    } else {
      var domainInflater = 1.3
      var min = d3.min(data[0].values, function(d){ return d.value }),
        max = d3.max(data[0].values, function(d){ return d.value })

      data.forEach(function(demo){
        var newMin = d3.min(demo.values, function(date){ return date.value }),
          newMax = d3.max(demo.values, function(date){ return date.value })
        if ( newMin < min ) { min = newMin }
        if ( newMax > max ) { max = newMax }
      })

      y.domain([ 0, max * domainInflater ])
    }
  }

  function usLineChart(){
    var topicStub = SELECTED_CAT.substring(0, SELECTED_CAT.length-3);
    //there is a coc in the data but we don't use it on this particular chart
    //2/15 researchers decided they don't want AAPI in this so I've remvoed 'api' from localDemos
    var localDemos = ['all', 'bla', 'lat', 'nat', 'whi']
    var nested = [];

    localDemos.forEach(function(d){
      var obj = {
        'key': d,
        'values': []
      }
      nested.push(obj)
    })

    for (var i=0; i < localDemos.length; i++){
      usData.forEach(function(monthData){
        var obj = {
          'date': monthData.date,
          'value': +monthData[topicStub + localDemos[i]]
        }
        nested[i].values.push(obj)
      })
    }

    setYDomain(nested)
    drawLine(nested)
  }

  function stateLineChart(){
    //all measures share the same root followed by _all, _coc, _whi (as stored in DEMOS)
    var topicStub = SELECTED_CAT.substring(0, SELECTED_CAT.length-3);

    var oneState = statesData.filter(function(state){
      return state.place === SELECTED_STATE
    });

    //shape the data to pass to line function:
    // an array of objects with the line id'd by 'key' and an array of key/value pairs
    // {date: , value: } that the line function will use
    var nestedByDemo = [];
    for ( var i = 0; i < DEMOS.length; i++ ){
      nestedByDemo.push({'key': DEMOS[i], 'values': [] })
      oneState.forEach(function(monthData){
        var obj = {
          'date': monthData.date,
          'value': +monthData[topicStub + DEMOS[i]]
        }
        nestedByDemo[i].values.push(obj)
      })
    }
    //slap on that all-us line
    nestedByDemo.push({'key': 'us-all', 'values': [] })
    usData.forEach(function(month){
      var obj = {
        'date': month.date,
        'value': +month[topicStub + 'all']
      }
      nestedByDemo[3].values.push(obj)
    })

    setYDomain(nestedByDemo)

    drawLine(nestedByDemo);
  }

  function countyLineChart(){

    var topicStub = SELECTED_CAT.substring(0, SELECTED_CAT.length-3);

    var selectedCountyData = countiesData.filter(function(row){
      return row.place === SELECTED_COUNTY
    })

    var selectedStateData = statesData.filter(function(row){
      return row.place === SELECTED_STATE
    })

    var nestedByAllMeasure = [
      {
        'key': 'ct-all',
        'values': []
      },
      {
        'key': 'ct-coc',
        'values': []
      },
      {
        'key': 'ct-whi',
        'values': []
      },
      {
        'key': 'us-all',
        'values': []
      },
      {
        'key': 'st-all',
        'values': []
      }

    ];
    // DEMOS = ["all", "coc", "whi"]
    for ( var i = 0; i < DEMOS.length; i++ ){
      selectedCountyData.forEach(function(monthData){
        var obj = {
          'date': monthData.date,
          'value': +monthData[topicStub + DEMOS[i]]
        }
                      //relies on order of nestedByAllMeasure following DEMOS
        nestedByAllMeasure[i].values.push(obj)
      })
    }
    //these also rely on the order of nestedByDemo, array number hard coded
    usData.forEach(function(month){
      var obj = {
        'date': month.date,
        'value': +month[topicStub + 'all']
      }
      nestedByAllMeasure[3].values.push(obj)
    })

    selectedStateData.forEach(function(monthData){
      var obj = {
        'date': monthData.date,
        'value': +monthData[topicStub + 'all']
      }
      nestedByAllMeasure[4].values.push(obj)
    })
    setYDomain(nestedByAllMeasure)
    drawLine(nestedByAllMeasure)
  }

  function updateLineLegend(data){

    var stateName,
      countyInfo
    if (GEOG_LEVEL === 'state'){
      stateName = stateNameLookup[SELECTED_STATE]
    } else if (GEOG_LEVEL === 'county'){
      stateName = stateNameLookup[SELECTED_STATE]
      countyInfo = countyMap.get(SELECTED_COUNTY).county
    }

    var labels = {
      'nation': {
        'all': 'All communities',
        'whi': 'White',
        'bla': 'Black', //cyan
        'lat': 'Hispanic', //magenta
        'api': 'AAPI', //navy
        'nat': 'Native American'
      },
      'state': {
        'all': stateName,
        'coc': stateName + ' communities of color',
        'whi': stateName + ' majority white communities',
        'us-all': 'United States'
      },
      'county': {
        'ct-all': countyInfo,
        'ct-coc': countyInfo + ' communities of color',
        'ct-whi': countyInfo + ' majority white communities',
        'us-all': 'United States',
        'st-all': stateName
      }
    }

  d3.select('#line-legend').selectAll('li').remove()
    d3.select('#line-legend').selectAll('li')
      .data(data)
      .enter()
      .append('li')
      .attr('class', function(d){ return GEOG_LEVEL + d.key })
      .html(function(d){ return '<div class=\'legend-dash\'></div>' + labels[GEOG_LEVEL][d.key] })
  }


  function fillTemplate(dotData){

    var template
    if (IS_MOBILE){
      template = GEOG_LEVEL === 'nation' ? d3.select('#mobile-nation-scoreboard') : d3.select('#mobile-state-county-scoreboard')
      //changes the month over teh whole table
      d3.select('.selected-month').text(d3.timeFormat('%B')(parseTime(SELECTED_MONTH)))
    } else {
      template = GEOG_LEVEL === 'nation' ? d3.select('#nation-scoreboard') : d3.select('#state-county-scoreboard')
    }
                              //fill out the template
    var mouseoverData = d3.nest().key(function(d){ return d.date }).entries(dotData),
      thisMonth = mouseoverData[dataMonths.indexOf(SELECTED_MONTH)].values
    for (var j = 0; j < thisMonth.length; j++){
      //adds the scores
      var text
      if (isNaN(+thisMonth[j].value)){
        text = 'n/a'
      } else {
        text = formatScore(thisMonth[j].value)
      }
      template.select('.' + thisMonth[j].key).text(text)
    }
        //fills out labels for specific places
    if (GEOG_LEVEL === 'state'){
      var stateName = stateNameLookup[SELECTED_STATE]
      template.select('.cat.st').text(stateName)
      template.select('.name-coc').text(stateName + ' communities of color')
      template.select('.name-whi').text(stateName + ' majority white communities')
      template.selectAll('.cat.ct, .val.ct').style('display', 'none')
    } else if (GEOG_LEVEL === 'county'){
      var stateName = stateNameLookup[SELECTED_STATE],
      countyName = countyMap.get(SELECTED_COUNTY).county
      template.select('.cat.st').text(stateName)
      template.select('.name-coc').text(countyName + ' communities of color')
      template.select('.name-whi').text(countyName + ' majority white communities')
      template.selectAll('.cat.ct, .val.ct').style('display', 'table-cell')
      template.select('.cat.ct').text(countyName)
    }

  }



  function drawLine(data){

    updateLineLegend(data);
    var dotData = []
    for (var i = 0; i < data.length; i++){
      for (var j = 0; j < data[i].values.length; j++){
        var obj = {
          'date': data[i].values[j].date,
          'key': data[i].key,
          'value': data[i].values[j].value
        }
        dotData.push(obj)
      }
    }

    line
      .x(function(d){ return x(parseTime(d.date)) })
      .y(function(d){ return y(d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    lineYAxis.call(yAxis);

    lineXAxis.call(xAxis)

    d3.selectAll('.click-catcher').remove();
    d3.selectAll('.year-label').remove();

    lineXAxis.selectAll('.tick')._groups[0].forEach(function(tick){
      var selection = d3.select(tick)
      selection.append('text')
        .text('2020')
        .attr('class', 'year-label')
        .attr('dy',3)
        .attr('y',27)
        .attr('fill','#000000')

      selection.append('rect')
        .attr('width', lineChartWidth / dataMonths.length)
        .attr('height', lineChartHeight + 31) // text y + dy
        .attr('fill', '#FFFFFF')
        .attr('fill-opacity', 0)
        .attr('class', 'click-catcher')
        .attr('x', ( (lineChartWidth / dataMonths.length) / 2 ) * -1)
        .attr('y', -lineChartHeight)

      selection.append('rect')
        .attr('width', lineChartWidth / dataMonths.length )
        .attr('height', 2)
        .attr('class', 'underscore')
        .attr('fill', COLORS['urbanBlue'][1])
        .attr('x', ( (lineChartWidth / dataMonths.length) / 2 ) * -1)
        .attr('y', 40)

    })

    var gPosition = dataMonths.indexOf(SELECTED_MONTH) + 2
    d3.select('div.state-lines > svg > g > g.x-axis > g:nth-child(' + gPosition + ')').classed('selected',true)

    lineYAxis.selectAll('.tick text').attr('x', -13).attr('dy', 14)
    lineYAxis.selectAll('.tick line').attr('x1', -lineMargin.left )

    //sort data so the highest value is first, this allows positioning the tooltip right over the top line
    data.sort(function(a,b){
      return b.values[dataMonths.indexOf(SELECTED_MONTH)].value -
      a.values[dataMonths.indexOf(SELECTED_MONTH)].value
    })

    var linePath = lineChartSvg.selectAll('.data-line')
      .data(data, function(d){ return d.key })

      linePath.enter()
        .append('path')
        .attr('fill', 'none')
        .attr('class', 'data-line')
        .attr('data-label', function(d){ return d.key })
        .attr('stroke', function(d){
          return colorScheme[GEOG_LEVEL][d.key]
        })
        .attr('stroke-width', 3)
        .attr('d', function(d){ return line(d.values)  })

      linePath.transition()
        .attr('d', function(d){ return line(d.values)  })
        .attr('stroke', function(d){ return colorScheme[GEOG_LEVEL][d.key] })

      linePath.exit().remove();

      //add some circles
      var markers = lineChartSvg.selectAll('.dot')
          .data(dotData)

      markers.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 }} )
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
        .attr('stroke', function(d){
          return colorScheme[GEOG_LEVEL][d.key]
        })
        .attr('stroke-width', 2)
        .attr('cx', function(d){
          if (isNaN(d.value)){
            return
          } else {
            return x(parseTime(d.date)) }
          })
        .attr('cy', function(d){
          if (isNaN(d.value)){
            return
          } else {
           return y(d.value) }
        })

      markers.transition()
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 }} )
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
        .attr('stroke', function(d){
          return colorScheme[GEOG_LEVEL][d.key]
        })
        .attr('stroke-width', 2)
        .attr('cx', function(d){
          if (isNaN(d.value)){
            return
          } else {
            return x(parseTime(d.date)) }
          })
        .attr('cy', function(d){
          if (isNaN(d.value)){
            return
          } else {
           return y(d.value) }
        })

        markers.moveToFront();
        markers.exit().remove();

        if (IS_MOBILE){
          var template = GEOG_LEVEL === 'nation' ? d3.select('#mobile-nation-scoreboard') : d3.select('#mobile-state-county-scoreboard'),
          scoocher = 25
          // $('.mobile-chart-tooltip').css('display', 'none')
          // template.style('display', 'block')

          fillTemplate(dotData)

          var gPosition = dataMonths.indexOf(SELECTED_MONTH) + 2
          //show selected month as selected on the axis
          d3.select('div.state-lines > svg > g > g.x-axis > g:nth-child(' + gPosition + ')').classed('selected',true)

          lineXAxis.selectAll('.tick').on('click', function(tick){
            //click changes the date
            SELECTED_MONTH = d3.timeFormat('%-m/%-d/%Y')(tick)
            // prepareDataAndUpdateMap();
            updateTitles();

            // $('#vertical-timeline > g.clicked').attr('class','unclicked')
            // d3.select('#vertical-timeline > g[data-month=\'' + SELECTED_MONTH + '\']').classed('clicked', true)

            d3.selectAll('.tick').classed('selected', false)
            d3.select(this).classed('selected', true)

            d3.selectAll('.dot')
              .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
              .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })

            fillTemplate(dotData)

          })
        } else { //DESKTOP
          var template = GEOG_LEVEL === 'nation' ? d3.select('#nation-scoreboard') : d3.select('#state-county-scoreboard'),
          scoocher = 25

          lineXAxis.selectAll('.tick').on('click', function(tick){
            //click changes the date
            SELECTED_MONTH = d3.timeFormat('%-m/%-d/%Y')(tick)

            d3.select('#vertical-timeline > g.clicked').classed('clicked', false).classed('unclicked', true)
            d3.select('#vertical-timeline > g[data-month=\'' + SELECTED_MONTH + '\']').classed('clicked', true).classed('unclicked', false)

            d3.selectAll('.tick').classed('selected', false)
            d3.select(this).classed('selected', true)

            d3.selectAll('.dot')
              .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
              .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })

            prepareDataAndUpdateMap();
            updateTitles();

          }).on('mouseenter', function(tick){
                //hover temporarily changes the date and puts a tooltip over the topmost datapoint at that year

            PREVIOUS_SELECTED_MONTH = SELECTED_MONTH
            SELECTED_MONTH = d3.timeFormat('%-m/%-d/%Y')(tick)

            d3.selectAll('.tick').classed('selected', false)
            d3.select(this).classed('selected', true)

            //changing the time only changes which line marker is highlighted, it doesn't redraw the chart
            d3.selectAll('.dot')
              .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
              .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })

            d3.select('#vertical-timeline > g[data-month=\'' + SELECTED_MONTH + '\']').classed('moused', true)

            d3.selectAll('.tick').classed('selected', false)
            d3.select(this).classed('selected', true)

            fillTemplate(dotData)

            //get the position of this month on the x-axis of the line chart
            var tickNum = dataMonths.indexOf(SELECTED_MONTH) + 2,
              tooltipOffset = $('div.state-lines > svg > g > g.x-axis > g:nth-child(' + tickNum + ')').offset().left
            //place the tooltip
            template
              .style('left', tooltipOffset - (template.node().getBoundingClientRect().width / 2) + 29 + 'px')
              .style('top', $('.data-line').offset().top - template.node().getBoundingClientRect().height - scoocher + 'px')
              .style('opacity', 1)

            prepareDataAndUpdateMap();
            updateTitles();

          }).on('mouseout', function(tick){

            template.style('opacity', 0)
            SELECTED_MONTH = PREVIOUS_SELECTED_MONTH
            //if you're mousing out of something you just clicked on don't revert to PREVIOUS_SELECTED_MONTH
            if ( d3.select(this).classed('selected') ){
              SELECTED_MONTH = d3.timeFormat('%-m/%-d/%Y')(tick)
            }

            //take the temporary highlight off the vertical timeline
            d3.selectAll('#vertical-timeline > g.moused').classed('moused', false)
            //change which line markers are highlighted
            d3.selectAll('.dot')
              .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
              .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })

            prepareDataAndUpdateMap();
            updateTitles();

        })

      }
  }

  function lilChartByRace(){
    var topicStub = 'median_credit_score_';
    //there is a coc in the data but we don't use it on this particular chart
    //deleting 'api' here by researcher request
    var localDemos = ['all', 'bla', 'lat', 'nat', 'whi']
    var nested = [];

    localDemos.forEach(function(d){
      var obj = {
        'key': d,
        'values': []
      }
      nested.push(obj)
    })

    for (var i=0; i < localDemos.length; i++){
      usData.forEach(function(monthData){
        var obj = {
          'date': monthData.date,
          'value': +monthData[topicStub + localDemos[i]]
        }
        nested[i].values.push(obj)
      })
    }

    var dotData = []
    for (var i = 0; i < nested.length; i++){
      for (var j = 0; j < nested[i].values.length; j++){
        var obj = {
          'date': nested[i].values[j].date,
          'key': nested[i].key,
          'value': nested[i].values[j].value
        }
        dotData.push(obj)
      }
    }

    lilChartLine
      .x(function(d){ return xLilChart(parseTime(d.date)) })
      .y(function(d){ return yLilChart(d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    lilChartYAxisG.call(yAxisLilChart)
    lilChartXAxisG.call(xAxisLilChart)


    lilChartYAxisG.selectAll('.tick text').attr('x', -15).attr('dy', 14)
    lilChartYAxisG.selectAll('.tick line').attr('x1', -lilChartMargin.left )

    lilChartXAxisG.selectAll('.tick')._groups[0].forEach(function(tick){
      return d3.select(tick).append('text')
        .text('2020')
        .attr('dy',3)
        .attr('y',27)
        .attr('fill','#000000')
      })

    lilChartSvg.selectAll('.line')
      .data(nested)
      .enter()
      .append('path')
        .attr('fill', 'none')
        .classed('line', true)
        .attr('stroke', function(d){ return colorScheme['nation'][d.key]})
        .attr('stroke-width', 3)
        .attr('d', function(d){
          return lilChartLine(d.values)
        })

    var markers = lilChartSvg.selectAll('.top-dot')
      .data(dotData)

    markers.enter()
      .append('circle')
      .attr('class', 'top-dot')
      .attr('r', 2.5)
      .attr('stroke', function(d){ return colorScheme['nation'][d.key] })
      .attr('fill', function(d){ return colorScheme['nation'][d.key] })
      .attr('stroke-width', 2)
      .attr('cx', function(d){ return xLilChart(parseTime(d.date)) })
      .attr('cy', function(d){ return yLilChart(d.value) })
  }

  //I'm the init
  if (!IS_MOBILE){
    prepareDataAndUpdateMap();
  }
  lilChartByRace();
  if (GEOG_LEVEL === 'nation'){
    usLineChart();
  } else if (GEOG_LEVEL === 'state'){
    stateLineChart();
    updateTitles();
    $('.stateCountySearch').val(nameFips[SELECTED_STATE]).trigger('change')
  } else if (GEOG_LEVEL === 'county'){
    countyLineChart();
    updateTitles();

    $('.stateCountySearch').val(nameFips[SELECTED_STATE]).trigger('change')
    $('.stateCountySearch').val(SELECTED_COUNTY).trigger('change')
  }

  $('#line-chart-container').css('margin-top', $('#map-header').outerHeight() + 10)


  d3.select(window).on('resize', resize);

  function resize(){
    IS_MOBILE = $(window).width() < 800 ? true : false;

    if (!IS_MOBILE){
      prepareDataAndUpdateMap();
      mapWidth = parseFloat(d3.select('#map-container').style('width'));
      mapWidth = mapWidth - margin.left - margin.right;
      mapHeight = mapWidth * mapRatio;
      //some examples:
      // https://observablehq.com/@rdmurphy/responsive-maps-based-on-the-bounds-of-projected-geographi
      // http://bl.ocks.org/chriscanipe/071984bcf482971a94900a01fdb988fa
      // https://codepen.io/TiannanZ/pen/rrEKoB

      // resize the map container
      usMap
        .style('width', mapWidth + 'px')
        .style('height', mapHeight + 'px');

      if (GEOG_LEVEL === 'nation'){
        projection.fitExtent([[0,0],[mapWidth,mapHeight]], featureCollection)

                 // resize the map
        usMap.selectAll('.counties').attr('d', path);
        usMap.selectAll('.state-outlines').attr('d', path);
      } else {
        var d = topojson.feature(us, us.objects.states).features.filter(function(s){ return s.id == nameFips[SELECTED_STATE]} )[0]

        //possible alternate way to go: https://bl.ocks.org/veltman/77679636739ea2fc6f0be1b4473cf03a
        centered = centered !== d && d;

        var statePaths = usMap.selectAll('.state-outlines')
          .classed('active', function(d){ d === centered });

        var countyPaths = usMap.selectAll('.counties')
          .classed('active', function(d){ return d === centered })

        // Starting translate/scale
        var t0 = projection.translate(),
          s0 = projection.scale();

        // Re-fit to destination
        projection.fitSize([mapWidth, mapHeight], centered || d);

        // Create interpolators
        // var interpolateTranslate = d3.interpolate(t0, projection.translate()),
        //     interpolateScale = d3.interpolate(s0, projection.scale());

        // var countyInterpolator = function(t) {
        //   projection.scale(interpolateScale(t))
        //     .translate(interpolateTranslate(t));
        //   countyPaths.attr('d', path);
        // };

        // d3.transition()
        //   .duration(0)
        //   .tween('projection', function() {
        //     return countyInterpolator;
        //   })
      }
    } else {
      makeMobileMenu()

      var template = GEOG_LEVEL === 'nation' ? d3.select('#mobile-nation-scoreboard') : d3.select('#mobile-state-county-scoreboard'),
      scoocher = 25

      template.style('display', 'block')
                    //fill out the template
      // var mouseoverData = d3.nest().key(function(d){ return d.date }).entries(dotData),
      //   thisMonth = mouseoverData[dataMonths.indexOf(SELECTED_MONTH)].values

      // for (var j = 0; j < thisMonth.length; j++){
      //   template.select('.' + thisMonth[j].key).text(thisMonth[j].value)
      // }


      lineYAxis.selectAll('.tick text').attr('x', -15).attr('dy', 14)
      lineYAxis.selectAll('.tick line').attr('x1', -lineMargin.left )
    }


    lineChartDivWidth = parseFloat(d3.select('#line-chart-container').style('width')) - mobileShrinkAmt
    lineChartDivHeight = lineChartDivWidth * lineChartRatio
    lineChartWidth = lineChartDivWidth - lineMargin.left - lineMargin.right
    lineChartHeight = lineChartDivHeight - lineMargin.top - lineMargin.bottom

    lineChartSvg
      .attr('width', lineChartWidth + lineMargin.left + lineMargin.right)
      .attr('height', lineChartHeight + lineMargin.top + lineMargin.bottom);

    x.range([0, lineChartWidth])

    y.range([lineChartHeight, 0])

  //   var lineYAxis = lineChartSvg.append('g')
  // .attr('class', 'grid')

    lineXAxis.attr('transform', 'translate(0,' + lineChartHeight + ')')

    lineYAxis.call(yAxis);

    lineXAxis.call(xAxis)

    lineChartSvg.selectAll('.data-line')
      .attr('d', function(d){ return line(d.values)  })

    lineChartSvg.selectAll('.dot')
      .transition()
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 }} )
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
        .attr('stroke', function(d){
          return colorScheme[GEOG_LEVEL][d.key]
        })
        .attr('stroke-width', 2)
        .attr('cx', function(d){
          if (isNaN(d.value)){
            return
          } else {
            return x(parseTime(d.date)) }
          })
        .attr('cy', function(d){
          if (isNaN(d.value)){
            return
          } else {
           return y(d.value) }
        })

    lilChartDivWidth = parseInt(d3.select('#median-credit-and-race-chart').style('width'))
    lilChartDivHeight = lilChartDivWidth * lilChartAspectRatio
    lilChartWidth = lilChartDivWidth - lilChartMargin.left - lilChartMargin.right
    lilChartHeight = lilChartDivHeight - lilChartMargin.top - lilChartMargin.bottom

   lilChartSvg
    .attr('width', lilChartWidth + lilChartMargin.left + lilChartMargin.right)
    .attr('height', lilChartHeight + lilChartMargin.top + lilChartMargin.bottom)


    xLilChart.range([0, lilChartWidth])
    yLilChart.range([lilChartHeight, 0])

    lilChartYAxisG.call(yAxisLilChart)
    lilChartXAxisG.call(xAxisLilChart)

    lilChartSvg.selectAll('.line')
      .attr('d', function(d){ return lilChartLine(d.values) })

    $('#line-chart-container').css('margin-top', $('#map-header').outerHeight() + 10)
    $('ul.select2-selection__rendered > li:nth-child(2)').css('left', tagScootch)

  }

}

