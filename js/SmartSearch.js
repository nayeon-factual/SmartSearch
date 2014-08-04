var facetable = ["country", "region", "state", "province", "locality", "town", "city", "zipcode", "zip", "postcode", "postalcode", "category", "chain", "chain name"];

var filtersHistory = {country:0, region:0, locality:0, post_town:0, category_ids:0, chain_name:0};
var filtersCount = 0;
var qHistory = [];

var URL = "http://www.factual.com/data/t/places#";

function keyPress(){
    //on enter
    if (event.keyCode == 13) {
        updateqURL();
    //on colon ":"
    }else if(event.keyCode == 186){
        var filterName = $('.searchInput').val();
        //**TODO** make sure filterName is a valid filter Name. 
        $('#categoryLabel').html(filterName+' :');
        swapView();
        setSelect2(filterName);
    }
}

function swapView(){
    if($('.hiddenToggle').css('display')=='none'){
        //Show Filter View
        $('.hiddenToggle').css('display', 'block');
    }else{
        //Close Filter View
        $('.hiddenToggle').css('display', 'none');
    }
    //**TODO** add red/green filter color based on facetable filter
}

function setSelect2(filterName){
    var objName = categorize(filterName);
    var obj = eval(objName);
    var objKeys = Object.keys(obj);
    
    var filterList = [{text: filterName, children:[]}];
        for(i=0; i<objKeys.length; i++){
            var filt_set = {};
            var filt_ID = objKeys[i];
            filt_set["id"] = filt_ID;
            filt_set["text"] = obj[filt_ID];
            filterList[0]["children"].push(filt_set);
        }
    $(document).ready(function() {
//        $(".filterInput").select2('focus');
        $(".filterInput").select2({
            multiple: true,
            data: filterList})
        .on('change', function(e){
            //e.value returns category ID of the selected --> put into URL
            updateFiltersURL(objName, e.val[0]);
        });
});
}
                                  
function ClearFields() {
     $(".searchInput").val('');
     $(".filterInput").select2("val", "");
}

function reset() {
    URL = "http://www.factual.com/data/t/places#";
    $("#history").empty();
    filtersHistory = {country:0, region:0, locality:0, post_town:0, category_id:0, chain_name:0};
    filtersCount = 0;
    qHistory = [];
}

function categorize(filterName) {
    if(filterName == "state" || filterName == "province"){
        filterName = "region";
    }else if(filterName == "city" || filterName == "town"){
        filterName = "locality";
    }else if(filterName == "chain" || filterName == "chain name") {
        filterName = "chain_name";
    }else if(filterName == "category") {
        filterName = "category_ids";
    }else if(filterName == "zipcode" || filterName == "zip" || filterName == "postcode" || filterName == "postalcode"){
        filterName = "post_town";   
    }
    return filterName;
}

function formatNewFilterInput(filter, input) {
    input = input.split(' ').join('+');
    filter = '"'+filter+'"'; 
    input = '"'+input+'"';
    return '{'+filter+':{"$eq":'+input+'}}';
}

function formatqInput(i) {
    i = i.split(' ').join('+');
    i = '"'+i+'"';
    return i;
}

function generateURL(fName, filterValue) {
//    console.log(fName+' '+filterValue);
    if (filtersCount==0) {
        firstInput = formatNewFilterInput(fName, filterValue);
        //check if there is already a keyword filter  
        if(qHistory.length==0){
            URL = URL+'filters={"$and":['+firstInput+']}';
        }else{
            URL = URL+'&filters={"$and":['+firstInput+']}';
        }

    } else if (filtersHistory[fName]==0) {
        newFilterInput = formatNewFilterInput(fName, filterValue);
        URL = URL.slice(0, URL.indexOf('filters={"$and":[')+17)+newFilterInput+','+URL.slice(URL.indexOf('filters={"$and":[')+17); 

    } else if (filtersHistory[fName]>0) {
        filterValue = filterValue.split(' ').join('+');
        URL = URL.split('"'+fName+'":{"$eq"').join('"'+fName+'":{"$in"');
        var firstIndex = URL.indexOf(fName+'":{"$in":')+fName.length+9;
        var closingBraceIndex = URL.slice(firstIndex).indexOf("}}")
        URL = URL.slice(0, firstIndex) + '["' + filterValue + '", ' + URL.slice(firstIndex).slice(0,closingBraceIndex) +']'+ URL.slice(firstIndex).slice(closingBraceIndex);
    }
}

function updateFiltersURL (objName, selectVal) { //for countries, take in countries etc. 
    generateURL(objName, selectVal);
    filtersHistory[objName]+=1;
    filtersCount += 1;
    $("#history").append('<div class="filterbox">'+eval(objName)[selectVal]+'</div>');
    ClearFields();
    swapView();
}


function updateqURL() {
    var searchInput = $('.searchInput').val();
        
    qInput = formatqInput(searchInput);
        if(qHistory.length==0 && filtersCount==0){
            URL = URL+'q='+qInput;
        }else if(qHistory.length==0 && filtersCount>0){
            URL = URL+'&q='+qInput;
        }else if(qHistory.length>0){
            URL = URL.slice(0, URL.indexOf("q=")+2)+qInput+','+URL.slice(URL.indexOf("q=")+2);
        }
        //Add to Keywords History
        qHistory.push(qInput);
        $("#history").append('<div class="filterbox">'+searchInput+'</div>');
        ClearFields();
        }

function openURL() {
    window.open(URL);
}
