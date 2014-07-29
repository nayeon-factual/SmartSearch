
var facetable = ["country", "region", "state", "province", "locality", "town", "city", "zipcode", "zip", "postcode", "postalcode", "category", "chain", "chain_name"];
var filtersHistory = {country:0, region:0, locality:0, post_town:0, category:0, chain_name:0};
var filtersCount = 0;
var qHistory = [];
var URL = "http://www.factual.com/data/t/places#";
retrieve();

function ClearFields() {
     document.getElementById("searchInput").value = "";
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
    }else if(filterName == "chain") {
        filterName = "chain_name";
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

function goToData() {
    var searchInput = document.getElementById("searchInput").value;
    $("#history").append('<div class="filterbox">'+searchInput+'</div>');
    //= document.getElementById("history").innerHTML+searchInput+"<br/>"; 
    console.log(hasFilter(searchInput));
        //if search contains a filter, then separate filter and search values
        if(hasFilter(searchInput)){
            var filterName = searchInput.substring(0, searchInput.indexOf(":"));
            var filterValue = searchInput.substring(searchInput.indexOf(":")+1);
            //check if filter is facetable
            if(-1 < facetable.indexOf(filterName)){
                fName = categorize(filterName);
                //**TODO** regexes check

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
                
                filtersHistory[fName]+=1;
                filtersCount += 1;
//                window.open(URL);
                
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
//            window.open(URL);
        }
    ClearFields();
}

function openURL() {
    window.open(URL);
}

//function retrieve() {
//    console.log($.get('http://api.v3.factual.com/t/restaurants-us?filters={"name":{"$bw":"star"}}&include_count=true'));
//}
