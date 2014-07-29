var facetable = ["country", "region", "state", "province", "locality", "town", "city", "zipcode", "postcode", "postalcode", "category", "chain"];
var filtersHistory = {country:0, region:0, locality:0, post_town:0, category:0, chain:0};
var filtersCount = 0;
var qHistory = [];
var URL = "http://www.factual.com/data/t/places#";

function ClearFields() {
     document.getElementById("searchInput").value = "";
}

function categorize(filterName) {
    if(filterName == "state" || filterName == "province"){
        filterName = "region";
    }else if(filterName == "city" || filterName == "town"){
        filterName = "locality";
    }else if(filterName == "zipcode" || filterName == "postcode" || filterName == "postalcode"){
        filterName = "post_town";   
    }
    return filterName;
}

function formatNewFilterInput(filter, input) {
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
    document.getElementById("history").innerHTML = document.getElementById("history").innerHTML+searchInput+"<br/>";    
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
                    URL = URL.split('"'+fName+'":{"$eq"').join('"'+fName+'":{"$in"');
                    var firstIndex = URL.indexOf(fName+'":{"$in":')+fName.length+9;
                    var closingBraceIndex = URL.slice(firstIndex).indexOf("}}")
                    URL = URL.slice(0, firstIndex) + '["' + filterValue + '", ' + URL.slice(firstIndex).slice(0,closingBraceIndex) +']'+ URL.slice(firstIndex).slice(closingBraceIndex);
                }
                
                filtersHistory[fName]+=1;
                filtersCount += 1;
                console.log(URL);
                window.open(URL);
            }else{
                alert("filter field is incorrect!");
            }

        //search did not contain filter(keyword search)
        } else {
            qInput = formatqInput(searchInput);
            if(qHistory.length==0 && filtersCount==0){
                URL = URL+'q='+qInput;
                console.log(URL);
            }else if(qHistory.length==0 && filtersCount>0){
                URL = URL+'&q='+qInput;
            }else if(qHistory.length>0){
                URL = URL.slice(0, URL.indexOf("q=")+2)+qInput+','+URL.slice(URL.indexOf("q=")+2);
            }
            qHistory.push(qInput);
            window.open(URL);
        }          
}


////&filters={"$and":[    finput1, finput2    ]}
////'&filters={"$and": [ 
//{' "country":{"$eq":"US"}} 
//]}
//
////q="santa+monica","college"
//
//http://www.factual.com/data/t/places#filters={"$and":[{"post_town":{"$in":"90024"}}]} 
//
//filters={"$and":[      
//
//finput1 = {"country":{"$in":["US","CN"]}},
//finput2 = {"region":{"$in":["CA"]}},
//{"category_labels":{"$eq":"[%5C"COMMUNITY+AND+GOVERNMENT%5C",%5C"EDUCATION%5C",%5C"COLLEGES+AND+UNIVERSITIES%5C"]"}}
//]}