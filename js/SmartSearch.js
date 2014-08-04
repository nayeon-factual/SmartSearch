var facetable = ["country", "region", "state", "province", "locality", "town", "city", "zipcode", "zip", "postcode", "postalcode", "category", "chain", "chain name"];
var filtersHistory = {country:0, region:0, locality:0, post_town:0, category_ids:0, chain_name:0};
var filtersCount = 0;
var qHistory = [];
var URL = "http://www.factual.com/data/t/places#";
//filterSelect();
console.log(Object.keys(taxonomy));

function keyPress(){
    //on enter
    if (event.keyCode == 13) {
        document.getElementById('searchButton').click();
    //on colon ":"
    }else if(event.keyCode == 186){
        var filterName = $('.searchInput').val();
        $('#categoryLabel').html(filterName+' :');
        swapView();
        setSelect2(filterName);
    }
}

function swapView(){
    //Show Filter View
    $('.hiddenToggle').css('display', 'block');
    //**TODO** add red/green filter color based on facetable filter
    $('.filterInput').focus();
}

function setSelect2(filterName){
    //**TODO** Replace this function with getFilterList(filterName)
    var filterList = [{text: filterName, children:[]}];
        for(i=0; i<Object.keys(taxonomy).length; i++){
            var catArray = {};
            var catID = Object.keys(taxonomy)[i];
            catArray["id"] = catID;
            catArray["text"] = taxonomy[catID];
            filterList[0]["children"].push(catArray);
        }
    $(document).ready(function() {
        $(".filterInput").select2({
            multiple: true,
            data: filterList,
            maximumSelectionSize: 1
        }).on('change', function(e){
            //e.value returns category ID of the selected --> put into URL
        });
});
}
                                  
function ClearFields() {
     document.getElementsByClassName("searchInput").value = "";
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

function hasFilter(input) {
    if(input.indexOf(":")>-1){
        return true;
    }else{
        return false;
    }
}
//
//function getCategoryIDs(filterValue){
//    
//    var foo = $.getJSON('places-categories.json', function(data) {
//        var matchedIDs = [];
//        for(i=0; i < Object.keys(data).length; i++){
//            var catID = i+1;
//            var name = data[catID].Name;
//            var parent = data[catID].Parent;
//            if(name.toLowerCase()==filterValue.toLowerCase()){
//                matchedIDs.push(catID);
//                var parentID = catID;
//            }else if(matchedIDs.length>0 && parent == matchedIDs[0]){
//                matchedIDs.push(catID);
//            }else{
//                //**TODO** how to handle no match
//            }
//        }
//        console.log("getCategoryIds: " + matchedIDs);
//        return matchedIDs;
//    })
//    return foo;
//}


function generateURL(fName, filterValue) {
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

function goToFilterData() {

}

function goToKeyWordData() {
    var searchInput = document.getElementsByClassName("searchInput").value;
    
        //if search contains a filter, then separate filter and search values
        if(hasFilter(searchInput)){
            var filterName = searchInput.substring(0, searchInput.indexOf(":"));
            var filterValue = searchInput.substring(searchInput.indexOf(":")+1);
            //check if filter is facetable
            if(-1 < facetable.indexOf(filterName)){
                //**TODO** regexes check
                if(filterName == "category"){
                    fName = categorize(filterName);
                    var filterID = getCategoryIDs(filterValue);
                    //generateURL(fName, filterID);
                }else{
                    fName = categorize(filterName);
                    generateURL(fName, filterValue);
                }
                filtersHistory[fName]+=1;
                filtersCount += 1;
                
                
            }else{
                //**TODO** "Did you mean:"
                alert("filter field is invalid!!");
            }

        //search did not contain filter(keyword search)
        } else {
            qInput = formatqInput(searchInput);
            if(qHistory.length==0 && filtersCount==0){
                URL = URL+'q='+qInput;
            }else if(qHistory.length==0 && filtersCount>0){
                URL = URL+'&q='+qInput;
            }else if(qHistory.length>0){
                URL = URL.slice(0, URL.indexOf("q=")+2)+qInput+','+URL.slice(URL.indexOf("q=")+2);
            }
            qHistory.push(qInput);
        }
    $("#history").append('<div class="filterbox">'+searchInput+'</div>');
    ClearFields();
}

function openURL() {
    window.open(URL);
}
