
var SELECTED_CAT = 'subp_credit_all',
  SELECTED_MONTH = '10/1/2020',
  SELECTED_COUNTY = '01001',
  SELECTED_STATE = 'AL',
  SELECTED_COUNTY = '',
  DEMOS = ['all', 'coc', 'whi'],
  EXPANDED_DEMOS = ['all', 'whi', 'bla', 'lat', 'api', 'nat'],
  GEOG_LEVEL = 'nation'; //nation, state, county

//is there a URL query? if so
//-update those globals
//-either the titles and UI text will all be part of other fx or get their own
//if there's not a search string
if (location.search !== ''){
  getQueryParam()
}


var parseTime = d3.timeParse('%m/%d/%Y')

var margin = {top: 20, right: 20, bottom: 20, left: 30}

var containerWidth = parseInt(d3.select('#map-container').style('width')) - margin.left - margin.right;

var mapWidth = parseInt(d3.select('#map-container').style('width')) ,
    mapRatio = .7,
    mapHeight = mapWidth * mapRatio;

var usMap = d3.select('svg.map')
              .attr('height', mapHeight + 'px')
              .attr('width', mapWidth + 'px');

var lineMargin = {top: 15, right: 15, bottom: 15, left: 25}

var lineChartWidth = parseInt(d3.select('#line-chart-container').style('width')) - lineMargin.left - lineMargin.right,
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
  .defer(d3.csv, 'data/new/county.csv')
  .defer(d3.csv, 'data/new/state.csv')
  .defer(d3.csv, 'data/new/us.csv')
  .defer(d3.csv, 'data/dict.csv')
  .defer(d3.csv, 'data/state-county-names.csv')
  .defer(d3.csv, 'data/autocomplete-src2.csv')
  .defer(d3.json, 'https://d3js.org/us-10m.v1.json')
  .await(dataReady);


function dataReady(error, countiesData, statesData, usData, dict, countyLookup, autocompleteSrc, us){
      var countyMap = d3.map(countyLookup, function(d) { return d.id });
      //add demo label to dict and filter
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

          usLineChart();
      })


      $('.month-choice').on({
        click: function(){
          $('#vertical-timeline > g.clicked').attr('class','unclicked')
          $(this).parents().attr('class','clicked')
          SELECTED_MONTH = $(this).attr('data-month')
          prepareDataAndUpdateMap();
          updateTitles();
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

      function updateTitles(){
        var longMeasureName = dict.filter(function(measure){ return measure.value === SELECTED_CAT })[0].label,
        shortMeasureName = longMeasureName.substring(0,longMeasureName.length - 5).toLowerCase(),
        monthYear = d3.timeFormat('%B %Y')(parseTime(SELECTED_MONTH)),
        placeName,
        note;

        var usNote = '<b>Note:</b> AI/AN stands for American Indian and Alaska Native, Hispanic stands for Hispanic and Latinx, and AAPI stands for Asian American Pacific Islander Communities.',
        stateAndCountyNote = '<b>Note:</b> Detailed race data is not available for communities that are too small.'

        if ( GEOG_LEVEL === 'state' ){
          placeName = stateNameLookup[SELECTED_STATE]
          note = stateAndCountyNote
        } else if ( GEOG_LEVEL === 'county' ){
          placeName = countyMap.get(SELECTED_COUNTY).county + ', ' + stateNameLookup[SELECTED_STATE]
          note = stateAndCountyNote
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

        clusterScale
          .domain(febcountiesData.map(function(county){ return +county[selectedCatWithAllSuffix] }))
          .range(COLORS.urbanBlue[5])

        updateMapFills();
        updateLegend(clusterScale.clusters());

      }

      //MAP

      //https://prodevsblog.com/questions/1603297/scaling-d3-v4-map-to-fit-svg-or-at-all/
       var featureCollection = topojson.feature(us, us.objects.counties);
       var projection = d3.geoIdentity()
              .fitExtent([[0,0],[mapWidth,mapHeight]], featureCollection)

        var path = d3.geoPath().projection(projection)
        var centered
      //just do the basic map once, update fills onlyon click
      var counties = usMap.append('g')
          .attr('cursor', 'pointer')
        .selectAll('path')
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append('path')
          .attr('class', 'counties')
          .attr('d', path)
          .attr('stroke', 'white')
          .on('click', getPlaceFromMap)


      //https://codepen.io/TiannanZ/pen/rrEKoB
      usMap.append('path')
        .datum(topojson.mesh(us, us.objects.states))
        .attr('fill', 'none')
        .attr('stroke', '#FFFFFF')
        .attr('class', 'state-outlines')
        .attr('stroke-width', 2)
        .attr('d', path)
        //     usMap.append("path")
        // .data(topojson.feature(us, us.objects.states).features)
        // .attr("fill", "none")
        // .attr("stroke", "#FFFFFF")
        // .attr("class", 'state-outlines')
        // .attr("stroke-width", 2)
        // .attr("d", path)
        // .on("mouseover", function(d){
        //   if (GEOG_LEVEL === 'nation'){
        //     d3.select(this).attr('stroke', COLORS['yellow'][1]).attr('stroke-width', 3)
        //   }
        // })
        // .on("mouseout", function(d){
        //   if (GEOG_LEVEL === 'nation'){
        //     d3.select(this).attr('stroke', '#FFFFF').attr('stroke-width', 2)
        //   }
        // })

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
        }

        updateTitles()

        moveMap(goToState)
      }

      function getPlaceFromMap(evt){
        // d3.selectAll('.state-outlines').attr("stroke-width", 0)

        var stateFips = evt.id.substring(0,2)
        if ( GEOG_LEVEL === 'nation' ){
          d3.selectAll('.state-outlines').remove()
          GEOG_LEVEL = 'state'

          $('.stateCountySearch').val(stateFips).trigger('change')
          SELECTED_STATE = fipsNames[stateFips]

          moveMap(stateFips)
        } else if ( GEOG_LEVEL === 'state' || GEOG_LEVEL === 'county'){
          //what to do if someone clicks on a county in another state
          GEOG_LEVEL = 'county'

          if (fipsNames[stateFips] !== SELECTED_STATE){
            //clicking on a different state moves map and redo outline
            moveMap(stateFips)
          }
          SELECTED_COUNTY = evt.id
          $('.stateCountySearch').val(SELECTED_COUNTY).trigger('change')
          countyLineChart();
        }
        updateTitles();

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
              stateLineChart();

              // usMap.append("path")
              //   .datum(topojson.mesh(us, us.objects.states, function(d){ return d.id === stateFips }))
              //   .attr("fill", "none")
              //   .attr("stroke", COLORS.yellow[1])
              //   .attr("class", 'state-outlines')
              //   .attr("stroke-width", 5)
              //   .attr("d", path)

              return statePaths.attr('d', path).attr('stroke-width', 2)
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
        var stateName = stateNameLookup[SELECTED_STATE],
        countyName = countyMap.get(SELECTED_COUNTY)
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
            'ct-all': countyName, //yellow
            'ct-coc': countyName + ' communities of color',
            'ct-whi': countyName + ' majority white communities',
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
        console.log(data)

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
            // .tickFormat( function(d){ return IS_MOBILE ? '\'' + d3.timeFormat('%y')(d) : d3.timeFormat('%Y')(d) })
            );

        lineChartSvg.append('line')
            .attr('class', 'zero-line')
            .attr('x1', lineMargin.left)
            .attr('x2', lineChartWidth + lineMargin.left)
            .attr('y1', lineChartHeight)
            .attr('role','presentation')
            .attr('y2', lineChartHeight);


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
            // .call(d3.axisBottom(x).ticks(5));
            .call(d3.axisBottom(x))

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

        var topicStub = 'avg_cc_util_';
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
            // .call(d3.axisBottom(x).ticks(5));
            .call(d3.axisBottom(x))

        var y = d3.scaleLinear()
          .range([height, 0])

        var domainInflater = 1.1
        var min = d3.min(nested[0].values, function(d){ return d.value }),
          max = d3.max(nested[0].values, function(d){ return d.value })

        nested.forEach(function(demo){
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
      usLineChart();
      lilChartByMeasure();
      lilChartByRace();
      $('#line-chart-container').css('margin-top', $('#map-header').height() + 15 + 'px')


      d3.select(window).on('resize', resize);

      function resize(){

        mapWidth = parseInt(d3.select('#map-container').style('width'));
        mapWidth = mapWidth - margin.left - margin.right;
        mapHeight = mapWidth * mapRatio;

        lineChartWidth = parseInt(d3.select('#line-chart-container').style('width')) - lineMargin.left - lineMargin.right
        lineChartHeight = lineChartWidth * lineChartRatio

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


        lineChartSvg
          .style('width', lineChartWidth + 'px')
          .style('height', lineChartHeight + 'px');

        x.range([lineMargin.left, lineChartWidth - lineMargin.right])

        lineChartSvg.select('.x-axis')
          .attr('transform', 'translate(' + lineMargin.left + ',' + (lineChartHeight - lineMargin.bottom) + ')')
          .call(d3.axisBottom(x)
            // .tickFormat( function(d){ return IS_MOBILE ? '\'' + d3.timeFormat('%y')(d) : d3.timeFormat('%Y')(d) })
            );

        lineChartSvg.selectAll('.data-line')
          .attr('d', function(d){ return line(d.values)  })

        $('#line-chart-container').css('margin-top', $('#map-header').height() + 15 + 'px')

      }

}

