
var SELECTED_CAT,
  SELECTED_MONTH,
  SELECTED_COUNTY,
  SELECTED_STATE,
  SELECTED_COUNTY,
  GEOG_LEVEL, //nation, state, county
  DEMOS = ['all', 'coc', 'whi'],
  EXPANDED_DEMOS = ['all', 'whi', 'bla', 'lat', 'api', 'nat'],
  COUNTY_IDS;

//is there a URL query? if so
//-update those globals
//-either the titles and UI text will all be part of other fx or get their own
//if there's not a search string
if (location.search !== ''){
  // getQueryParam()

}


var parseTime = d3.timeParse('%m/%d/%Y')
                //force D3 to have the right labels on the axis

var dataMonths = ['2/1/2020', '4/1/2020', '6/1/2020','8/1/2020','10/1/2020']
var tickValues = dataMonths.map(function(d){ return parseTime(d) })

// [parseTime('2/1/2020'), parseTime('4/1/2020'), parseTime('6/1/2020'), parseTime('6/1/2020'), parseTime('8/1/2020'), parseTime('10/1/2020')]
var margin = {top: 20, right: 20, bottom: 20, left: 30}

var containerWidth = parseFloat(d3.select('#map-container').style('width')) - margin.left - margin.right;

var mapWidth = parseFloat(d3.select('#map-container').style('width')) ,
    mapRatio = .7,
    mapHeight = mapWidth * mapRatio;

var usMap = d3.select('svg.map')
              .attr('height', mapHeight + 'px')
              .attr('width', mapWidth + 'px');

var lineMargin = {top: 5, right: 15, bottom: 10, left: 25}

var lineChartWidth = parseFloat(d3.select('#line-chart-container').style('width')) - lineMargin.left - lineMargin.right,
    lineChartRatio = .615,
    lineChartHeight = lineChartWidth * lineChartRatio - lineMargin.top - lineMargin.bottom //starting guess

var lineChartSvg = d3.select('.state-lines')
  .attr('height', lineChartHeight + lineMargin.top + lineMargin.bottom)
  .attr('width', lineChartWidth + lineMargin.left + lineMargin.right)

var lineChartAxis = lineChartSvg.append('g')
  .attr('class', 'grid')
  .attr('transform', 'translate(' + lineMargin.left + ',' + lineMargin.top + ')')

var lineChartG = lineChartSvg.append('g')
  .attr('transform', 'translate(' + lineMargin.left + ',' + lineMargin.top + ')')

var x = d3.scaleTime()
  .range([0, lineChartWidth])
  .domain([parseTime('2/1/2020'), parseTime('10/1/2020')]) //TODO - hey dumbass, this is hard coded!

var y = d3.scaleLinear()
  .range([lineChartHeight - lineMargin.bottom, lineMargin.top])

var yAxis = d3.axisLeft(y)
  .tickSize(-lineChartWidth)
  .ticks(4)
  .tickFormat(function(d, i) {
    return d3.format('1')(d) + '%';
  })


var line = d3.line()

var colorScheme = {
  'nation': {
    'all': '#FDBF11', //yellow
    'whi': '#55B748', //green
    'bla': '#1696D2', //cyan
    'lat': '#EC008B', //magenta
    'api': '#0A4C6A', //navy
    'nat': '#D2D2D2'
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

   SELECTED_CAT = getQueryParam('cat', 'subp_credit_all', ["subp_credit_all", "debt_in_collect_all", "median_debt_in_collect_all", "avg_cc_util_all", "stud_loan_del_rate_all", "cc_del_rate_all", "auto_retail_loan_del_rate_all", "mortgage_del_rate_all", "afs_cred_all", "del_afs_credit_rate_all", " median_credit_score_all"]),
    SELECTED_MONTH = getQueryParam('month','10/1/2020',['2/1/2020','4/1/2020','6/1/2020','8/1/2020','10/1/2020']),
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
    .text(function(d){ return d.label.substring(0,d.label.length - 5).toLowerCase() })
    .attr('value', function(d){ return d.value })


  $('#dropdown').selectmenu({
    change: function (event, data){
      SELECTED_CAT = this.value
      d3.selectAll('.dek').text(dict.filter(function(d){ return d.value === SELECTED_CAT })[0].label.split(',')[0])
      prepareDataAndUpdateMap();
      updateTitles();
      if ( GEOG_LEVEL === 'nation' ){
        usLineChart();
      } else if ( GEOG_LEVEL === 'state' ){
        stateLineChart();
      } else {
        countyLineChart();
      }
    }
  })

  $("#dropdown").val(SELECTED_CAT);
  $("#dropdown").selectmenu("refresh");

  $('.stateCountySearch').select2({
    data: autocompleteSrc,
    placeholder: 'Search for your state or county'
  });

  $('.stateCountySearch').on('select2:select', function(evt){
    getPlaceFromTagLookup(evt);

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
          placeholder: 'Search for your state or county'
      });
  })

  $('.month-choice').on({
    click: function(){
      $('#vertical-timeline > g.clicked').attr('class','unclicked')
      $(this).parents().attr('class','clicked')
      SELECTED_MONTH = $(this).attr('data-month')
      prepareDataAndUpdateMap();
      updateTitles();
      //changing the time only changes which line marker is highlighted, it doesn't redraw the chart
      d3.selectAll('.dot')
        .attr('r', function(d){ if (isNaN(d.value)){ return 0 } else { return d.date === SELECTED_MONTH ? 4 : 2.5 } })
        .attr('fill', function(d){ return d.date === SELECTED_MONTH ? '#FFFFFF' : colorScheme[GEOG_LEVEL][d.key] })
      },
      mouseenter: function(){
        $(this).siblings().css('visibility', 'visible')
        $(this).siblings('text').css('opacity', '0.5')
      },
      mouseleave: function(){
        //only a g that's unclicked should go to hidden
        $(this).siblings().css('visibility', 'hidden')
        $(this).siblings('text').css('opacity', '1')
      }
  })

  $('#timeline-note-marker').on({
    mouseenter: function(){
        $(this).children('text').css('visibility','visible')
      },
      mouseleave: function(){
        $(this).children('text').css('visibility','hidden')
      }
  })

  $('#shareUrlBtn').on('click', function(evt){
    getShareUrl()
  })
  //this is for text that's changed by a click not a mouseover
  function updateTitles(){
    var longMeasureName = dict.filter(function(measure){ return measure.value === SELECTED_CAT })[0].label,
    shortMeasureName = longMeasureName.substring(0,longMeasureName.length - 5).toLowerCase(),
    monthYear = d3.timeFormat('%B %Y')(parseTime(SELECTED_MONTH)),
    placeName ='',
    note = '',
    stateScore = '',
    countyName = '',
    countyScore = '';

    var usNote = '<b>Note:</b> AI/AN stands for American Indian and Alaska Native, Hispanic stands for Hispanic and Latinx, and AAPI stands for Asian American Pacific Islander Communities.',
    stateAndCountyNote = '<b>Note:</b> Detailed race data is not available for communities that are too small.'

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
      $('#readout > li.county > span.place').text(countyName)
      $('#readout > li.county > span.pct').text(formatScore(countyScore))

    } else {
      placeName = 'United States'
      note = usNote
    }

    $('.title-measure-name').text(capFirstLetter(shortMeasureName))
    $('.map-title-date').text(monthYear)
    $('.line-title-name').text(placeName)
    $('.chart-note').html(note)

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
    .on('click', getPlaceFromMap)
    .on("mouseover", function(d){
      if (GEOG_LEVEL === 'nation'){
        var mousedState = fipsNames[d.id.substring(0,2)],
        stateClass = mousedState.toLowerCase(),
        stateOutline = d3.select('path.state-outlines.' + stateClass);

        stateOutline.attr('stroke', COLORS['yellow'][1]).attr('stroke-width', 3)
        stateOutline.moveToFront();

        var stateAbbrev = fipsNames[d.id]
        var data = statesData.filter(function(d){ return d.place === mousedState });

        $('#readout > li.state > span.place').text(stateNameLookup[mousedState])
        $('#readout > li.state > span.pct').text(formatScore(data[data.length - 1][SELECTED_CAT]) )
      } else {
        var mousedCounty = d3.select(this),
        mousedCountyId = d.id

        if (mousedCountyId.substring(0,2) !== nameFips[SELECTED_STATE] ){
          return
        } else {
          var placeName = countyMap.get(mousedCountyId).county + ' County',
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
    })
    .on("mouseout", function(d){
      if (GEOG_LEVEL === 'nation'){
        var mousedState = fipsNames[d.id.substring(0,2)],
        stateClass = mousedState.toLowerCase(),
        stateOutline = d3.select('path.state-outlines.' + stateClass);

        stateOutline.attr('stroke', '#FFFFFF').attr('stroke-width', 2)

        d3.select('.counties.selected').moveToFront()

        $('#readout > li.state > span.place').text('')
        $('#readout > li.state > span.pct').text('')
      } else {
        var mousedCounty = d3.select(this)
        mousedCounty.attr('stroke', '#FFFFFF').attr('stroke-width', 1)

        if (SELECTED_COUNTY !== ''){
          var placeName = countyMap.get(SELECTED_COUNTY).county + ' County',
          score = countiesData.filter(function(d){
            return d.date === SELECTED_MONTH
          }).filter(function(d){
              return d.place === SELECTED_COUNTY
          })[0][SELECTED_CAT]

          $('#readout > li.county > span.place').text(placeName)
          $('#readout > li.county > span.pct').text(score)
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
    .attr("fill", "none")
    .attr("stroke", "#FFFFFF")
    .attr("class", function(d){ return 'state-outlines ' + classify(fipsNames[d.id])  })
    .attr("stroke-width", 2)
    .attr("d", path)

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
    d3.select('#legend').selectAll('li').remove()
    d3.select('#legend').selectAll('li')
      .data(breaks)
      .enter()
      .append('li')
      .text(function(d){ return d })
      .style('border-left', function(d){ return '20px solid' + clusterScale(d) })
  }

  function getPlaceFromTagLookup(evt){

    var placeId = evt.params.data.id
    var placeName = evt.params.data.text
    var goToState = ''

    // the object should have indicator of GEOG LEVEL
    // Set the new GEOG_LEVEL
    // call either state or county line chart
    // figure out where to zoom, it will alwyas be to a state
    // if the user put in a county, grab off the state fips
    if ( placeId.length > 2 ){
      GEOG_LEVEL = 'county'
      SELECTED_COUNTY = placeId
      goToState = placeId.substring(0,2);
      SELECTED_STATE = fipsNames[goToState]
      countyLineChart();

    } else {
      GEOG_LEVEL = 'state'
      SELECTED_STATE = fipsNames[placeId]
      goToState = placeId
      stateLineChart();
      filterSearchOptionsToState();
    }
    d3.select('.counties.c' + SELECTED_COUNTY).classed('selected', true)
    updateTitles();

    moveMap(goToState)
  }

  function getPlaceFromMap(evt){

    var stateFips = evt.id.substring(0,2)
    if ( GEOG_LEVEL === 'nation' ){
      GEOG_LEVEL = 'state'
      $('.stateCountySearch').val(stateFips).trigger('change')
      SELECTED_STATE = fipsNames[stateFips]
      moveMap(stateFips);
      stateLineChart();
      filterSearchOptionsToState();
    } else if ( GEOG_LEVEL === 'state' || GEOG_LEVEL === 'county' ){
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
      } else { //clicking twice on same state brings you to county level geo
        GEOG_LEVEL = 'county'
        SELECTED_COUNTY = evt.id
        d3.selectAll('.counties').classed('selected', false)
        var mousedCounty = d3.select(this);
        mousedCounty.classed('selected', true)
        mousedCounty.moveToFront();
        countyLineChart();

      }

      $('.stateCountySearch').val(SELECTED_COUNTY).trigger('change')
    }
    updateTitles();

  }

  function filterSearchOptionsToState(){
    var stateFips = nameFips[SELECTED_STATE];
    var filteredOptions = autocompleteSrc.filter(function(d){
                                                  //i.e., not the state itself
      return d.id.substring(0,2) === stateFips && d.id !== stateFips
    })

    $('.stateCountySearch').empty().select2({
      data: filteredOptions
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
    var domainInflater = 1.3
    var min = d3.min(data[0].values, function(d){ return d.value }),
      max = d3.max(data[0].values, function(d){ return d.value })

    data.forEach(function(demo){
      var newMin = d3.min(demo.values, function(date){ return date.value }),
        newMax = d3.max(demo.values, function(date){ return date.value })
      if ( newMin < min ) { min = newMin }
      if ( newMax > max ) { max = newMax }
    })

    y.domain([0,max * domainInflater ])
  }

  function usLineChart(){
    var topicStub = SELECTED_CAT.substring(0, SELECTED_CAT.length-3);
    //there is a coc in the data but we don't use it on this particular chart
    var localDemos = ['all', 'api', 'bla', 'lat', 'nat', 'whi']
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
        'all': 'United States',
        'whi': 'White',
        'bla': 'Black', //cyan
        'lat': 'Hispanic', //magenta
        'api': 'AAPI', //navy
        'nat': 'AI/AN'
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

  function drawLine(data){
    updateLineLegend(data);

    line
      .x(function(d){ return x(parseTime(d.date)) })
      .y(function(d){ return y(d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    d3.select('.x-axis').remove();

    lineChartSvg.append('g')
      .attr('class','x-axis')
      .attr('transform', 'translate(' + lineMargin.left + ',' + (lineChartHeight + lineMargin.top - lineMargin.bottom) + ')')
      .call(d3.axisBottom(x)
          .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
          .tickValues(tickValues)
        );

      // yAxis.tickFormat(function(d){ return d + '%'});

    lineChartAxis.call(yAxis);

    var linePath = lineChartG.selectAll('path')
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

      lineChartG.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('role','presentation')
        .attr('x2', lineChartWidth)
        .attr('y1', lineChartHeight - lineMargin.bottom)
        .attr('y2', lineChartHeight - lineMargin.bottom);

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

    //add some circles, yo
    var markers = lineChartG.selectAll('.dot')
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
  }

  function lilChartByMeasure(){
    var measureLookup = d3.nest().key(function(d){ return d.value }).map(dict)

    var nonRateMeasures = [
      'median_debt_in_collect_all',
      'afs_cred_all',
      'median_credit_score_all'
    ];

    var selectedMeasure = 'stud_loan_del_rate_all'
                      //choosing the last one bc the later data has an extra measure in it
    var measureNames = Object.keys(usData[usData.length - 1]).filter(function(d){
                        return d.substring(d.length - 3, d.length) === 'all' && nonRateMeasures.indexOf(d) === -1
                      })


    var map = measureNames.map(function(measure){
        return {'key': measure, 'values': []}
    })

    for ( var i = 0; i < measureNames.length; i++ ){
      usData.forEach(function(monthData){
        var obj = {
          'date': monthData.date,
          'value': +monthData[measureNames[i]]
        }
        map[i].values.push(obj)
      })
    }

    var divWidth = parseInt(d3.select('#distress-eased').style('width')),
        aspectRatio = .675,
        divHeight = divWidth * aspectRatio;

    var margin = {top: 30, right: 30, bottom: 30, left: 30},
      width = divWidth - margin.left - margin.right,
      height = divHeight - margin.top - margin.bottom;

    var svg = d3.select('#distress-eased').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleTime()
      .range([0, width])
      .domain([parseTime('2/1/2020'), parseTime('10/1/2020')])
    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
                .call(d3.axisBottom(x)
          .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
          .tickValues(tickValues)
         )

    var y = d3.scaleLinear()
      .range([height, 0])

    var domainInflater = 1.1
    var min = d3.min(map[0].values, function(d){ return d.value }),
      max = d3.max(map[0].values, function(d){ return d.value })

    map.forEach(function(demo){
      var newMin = d3.min(demo.values, function(date){ return date.value }),
        newMax = d3.max(demo.values, function(date){ return date.value })
      if ( newMin < min ) { min = newMin }
      if ( newMax > max ) { max = newMax }
    })

    y.domain([0, max * domainInflater])

    // var yAxis = d3.axisLeft(y)
    //   .tickSize(-lineChartWidth)

    var line = d3.line().x(function(d){ return x(parseTime(d.date)) })
      .y(function(d){ return y(+d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    svg.append('g')
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(0)
        .tickFormat(function(d, i) {
          return d3.format('1')(d) + '%';
        })
      )

    svg.selectAll('.line')
      .data(map)
      .enter()
      .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#9D9D9D')
        .attr('stroke-width', 1.5)
        .attr('class', function(d){
          return d.key === selectedMeasure ? 'selected lilLine ' + d.key : 'lilLine ' + d.key;
        })
        .attr('d', function(d){
          return line(d.values)
        })
        .on('mouseover', function(d){

          var text = measureLookup.get(d.key)[0].label
          d3.selectAll('.lilLine').classed('selected', false)
          d3.select(this).classed('selected', true)
          d3.select('#distress-eased > span').text(text)
        })

      svg.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', height)
        .attr('role','presentation')
        .attr('y2', height);

  }

  function lilChartByRace(){

    var topicStub = 'median_credit_score_';
    //there is a coc in the data but we don't use it on this particular chart
    var localDemos = ['all', 'api', 'bla', 'lat', 'nat', 'whi']
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

    var divWidth = parseInt(d3.select('#median-credit-and-race').style('width')),
        aspectRatio = .675,
        divHeight = divWidth * aspectRatio;

    var margin = {top: 30, right: 30, bottom: 30, left: 30},
      width = divWidth - margin.left - margin.right,
      height = divHeight - margin.top - margin.bottom;

    var svg = d3.select('#median-credit-and-race').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleTime()
      .range([0, width])
      .domain([parseTime('2/1/2020'), parseTime('10/1/2020')])
    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x)
          .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
          .tickValues(tickValues)
         )

    var y = d3.scaleLinear()
      .range([height, 0])

    //decided to set these based on subjective opinion of what makes chart easiest to read
    y.domain([550, 800])

    // Allison's mocks have no grid lines here but I think ultimately you'll want them back
    // var yAxis = d3.axisLeft(y)
    //   .tickSize(-lineChartWidth)

    var line = d3.line().x(function(d){ return x(parseTime(d.date)) })
      .y(function(d){ return y(+d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    svg.append('g')
      .call(d3.axisLeft(y)
        .ticks(4)
        .tickSize(0)
        // .tickFormat(function(d, i) {
        //   return d3.format('1')(d) + '%';
        // })
      )

    svg.selectAll('.line')
      .data(nested)
      .enter()
      .append('path')
        .attr('fill', 'none')
        .attr('stroke', function(d){ return colorScheme['nation'][d.key]})
        .attr('stroke-width', 1.5)
        .attr('d', function(d){
          return line(d.values)
        })

    svg.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', height)
        .attr('role','presentation')
        .attr('y2', height);

  }


  //I'm the init
  prepareDataAndUpdateMap();
  lilChartByMeasure();
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
      var interpolateTranslate = d3.interpolate(t0, projection.translate()),
          interpolateScale = d3.interpolate(s0, projection.scale());

      var countyInterpolator = function(t) {
        projection.scale(interpolateScale(t))
          .translate(interpolateTranslate(t));
        countyPaths.attr('d', path);
      };

      d3.transition()
        .duration(0)
        .tween('projection', function() {
          return countyInterpolator;
        })
    }

    lineChartWidth = parseFloat(d3.select('#line-chart-container').style('width')) - lineMargin.left - lineMargin.right
    lineChartHeight = lineChartWidth * lineChartRatio - lineMargin.top - lineMargin.bottom

    lineChartSvg
      .attr('width', lineChartWidth + 'px')
      .attr('height', lineChartHeight + 'px');

    x.range([lineMargin.left, lineChartWidth - lineMargin.right])

    y.range([lineChartHeight - lineMargin.bottom, lineMargin.top])

    var line = d3.line().x(function(d){ return x(parseTime(d.date)) })
      .y(function(d){ return y(+d.value) })
      .defined(function(d){
        return !isNaN(d.value)
      })

    lineChartSvg.select('.x-axis')
      .attr('transform', 'translate(' + lineMargin.left + ',' + (lineChartHeight - lineMargin.bottom) + ')')
      .call(d3.axisBottom(x)
         .tickFormat( function(d){ return d3.timeFormat('%b')(d) } )
         .tickValues(tickValues)
        );

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

    $('#line-chart-container').css('margin-top', $('#map-header').outerHeight() + 10)

  }

}

