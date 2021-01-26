
// this works with twitter card/fb:og and the other socials to make that gray arrow at upper right
function toggle_visibility(id) {
  var e = document.getElementById(id);
  if (e.style.display == 'inline-block') e.style.display = 'none';else e.style.display = 'inline-block';
}

function classify(string){
  return string.replace(/\W+/g, '-').toLowerCase();
}

function capFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var stateAbbrevs = [ 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'US' ];

var fipsNames = {'01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','66':'GU','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','70':'Palau','42':'PA','72':'PR','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','78':'VI','53':'WA','54':'WV','55':'WI','56':'WY'}

var nameFips = {'AL':'01','AK':'02','AZ':'04','AR':'05','CA':'06','CO':'08','CT':'09','DE':'10','DC':'11','FL':'12','GA':'13','GU':'66','HI':'15','ID':'16','IL':'17','IN':'18','IA':'19','KS':'20','KY':'21','LA':'22','ME':'23','MD':'24','MA':'25','MI':'26','MN':'27','MS':'28','MO':'29','MT':'30','NE':'31','NV':'32','NH':'33','NJ':'34','NM':'35','NY':'36','NC':'37','ND':'38','OH':'39','OK':'40','OR':'41','Palau':'70','PA':'42','PR':'72','RI':'44','SC':'45','SD':'46','TN':'47','TX':'48','UT':'49','VT':'50','VA':'51','VI':'78','WA':'53','WV':'54','WI':'55','WY':'56'}

var stateNameLookup = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AS': 'American Samoa',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District Of Columbia',
    'FM': 'Federated States Of Micronesia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'GU': 'Guam',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MH': 'Marshall Islands',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'MP': 'Northern Mariana Islands',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PW': 'Palau',
    'PA': 'Pennsylvania',
    'PR': 'Puerto Rico',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VI': 'Virgin Islands',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
}

function getQueryParam(param,fallback, validOpts) {

    param = param.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + param + '=([^&#]*)');
    var results = regex.exec(location.search);
    if (results === null){
      return fallback;
    }else{
      var testResult = decodeURIComponent(results[1].replace(/\+/g, ' '))
      if(Array.isArray(fallback)){
        var selectionArray = testResult.split(',').filter(function(o){ return validOpts.indexOf(o) != -1 })
        if (param === 'array-sectors'){
          selectionArray = selectionArray.map(function(sector){
            return translate[sector]
          })
        }
        return selectionArray
      }else{
        // return (validOpts == 'all' || validOpts.indexOf(testResult) == -1) ? fallback : testResult;
        //if validOpts is 'all' or the test result isn't in valid Opts (like it's garbage) use the fallback, otherwise use the testresult
        if (validOpts === 'all'){
          return testResult
        } else if (validOpts.indexOf(testResult) == -1){
          return fallback
        } else if (validOpts.indexOf(testResult) > -1){
          return testResult;
        }


      }
    }
}

// var SELECTED_CAT = "subp_credit_all",
//   SELECTED_MONTH = "8/31/2020",
//   SELECTED_COUNTY = "01001",
//   SELECTED_STATE = 'AL',
//   SELECTED_COUNTY = '',
//   DEMOS = ["all", "coc", "whi"],
//   GEOG_LEVEL = 'nation'; //nation, state, county
// https://github.com/UrbanInstitute/college-racial-representation/blob/master/app/scripts/halpurs.js
function getShareUrl(){
  //the base url (localhost in dev, staging/prop when live) including protocol (https://) and full path
  var shareURL = window.location.origin + window.location.pathname

  //not the cleanest, since the default values are also included in the first few lines of main.js
  //(the calls to getQueryParam) but I don't mind if you don't
  var queryParams = [
    ['geography','geography','national'],
    ['chartType','chart-type','single-year-bar'],
    ['year','year','2017'],
    ['programLength','program-length','four'],
    ['singleRace','single-race','dif_hispa'],
    ['singleSector','single-sector','public-nonselective'],
    ['state','state','Alabama'],
    ['selectedSchool','selected-school',encodeURIComponent('Northern Virginia Community College')],
    ['arrayRaces','array-race',Object.keys(translateRace)],
    ['arraySectors','array-sectors',Object.keys(translate).slice(2)]//default val is for four year, so doesn't include the 2 two-year options
  ]

  var nonFallback = 0;
  for(var i = 0; i < queryParams.length; i++){
    var key = queryParams[i][0],
      param = queryParams[i][1],
      fallback = queryParams[i][2]

    //special cases for the race and sector arrays
    if(Array.isArray(fallback)){
      //test if array matches default/fallback value. If it does, no need to change URL
      if(higherEdSelections[key].length != fallback.length){

          //if the first param added to querystring, add a "?" before param, otherwise add "&"
          nonFallback += 1;
          if(nonFallback == 1) shareURL += '?'
          else shareURL += '&'

          //add key/value pair to url. This is basically just a "reverse lookup" in the translate object
          //(finding key by value instead of value by key), mapped onto the array of selected sectors
          shareURL += param + '=' + higherEdSelections[key].map(function(val){
            return Object.keys(translate).filter(function(k) { return translate[k] == val })[0];
          }).join(',')

      }
    }else{
      var val;

      if(val != fallback){
        //if the first param added to querystring, add a "?" before param, otherwise add "&"
        nonFallback += 1;
        if(nonFallback == 1) shareURL += '?'
        else shareURL += '&'

        //add key/value pair to URL
        shareURL += param + '=' + val
      }
    }

  }

  d3.select('#share-tooltip > input').attr('value', shareURL)
  d3.select('#share-tooltip').style('display','block')

  d3.selectAll('.copy-button').on('click', function(){
    d3.event.stopPropagation();
    copyTextToClipboard(shareURL)
    d3.select(this.parentNode).select('.copied-text')
      .style('opacity',1)
      .transition()
      .delay(1500)
      .duration(1000)
      .style('opacity', 0)
  })

  d3.select('#share-tooltip')
    .transition()
    .delay(3000)
    .style('display', 'none')

  return shareURL;
}

//clipboard functions from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}
