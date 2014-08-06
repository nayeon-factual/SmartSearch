//**TODO** put valid history term in filters[key].history after populating history div


//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(filterKey){
    var facetsObject = [];
    $.get(updateFacetsAPI(filterKey)).done(function (obj){
        var facetsObject = obj.response.data.country;
        var facetsKeys = Object.keys(facetsObject); //['us','cn','fr',....]
        console.log('facobj'+JSON.stringify(facetsKeys));
        var S2Data = formatSelect2Data(filterKey, facetsKeys);//**TODO**
        setSelect2(S2Data);
    }); //wait to return facetsObject
}

function updateFacetsAPI(filterKey){
    var facetsAPI = 'http://api.v3.factual.com/t/'+table_id+'/facets?select='+filterKey+'&limit=50&KEY='+key;
    //can't push limit higher than 50 - yes, try a couple hundred
    
    if(qHistory.length > 0){
        facetsAPI +='&q=';
        for(q=0; q < qHistory.length; q++){
            facetsAPI+=qHistory[q]+', ';
        }
        facetsAPI = facetsAPI.substring(0, facetsAPI.length -2);
        
    }if(filtersCount > 0){
        var formattedFilters = formatExistingFilters();
        facetsAPI+='&filters='+formattedFilters;
    }
    console.log('facetsAPI '+facetsAPI);
    return facetsAPI;
}

function formatExistingFilters(){
    var formatted = '{"$and":['
    var formattedNum = 0;
    
    for(f=0; f<Object.keys(filters).length; f++){
        if(formattedNum>0){
            formatted+=', ';
        }
        var currentFilterKey = Object.keys(filters)[f];
        if(filters[currentFilterKey].history.length==1){ 
            formatted+='{"'+currentFilterKey+'":{"$eq":"'+filters[currentFilterKey].history[0]+'"}}';
            formattedNum++;
        }else if(filters[currentFilterKey].history.length > 1){
            var historyString = filters[currentFilterKey].history.toString();
            var historyArray = historyString.split(',').join('","');
            formatted+='{"'+currentFilterKey+'":{"$in":["'+historyArray+'"]}}';
            formattedNum++;
        }
    }
    formatted += ']}'
    return formatted;
}

//returns correctly formatted data for select2
function formatSelect2Data(filterKey, facetsArray){
    if(filterKey=='category_ids'){//obj = [12,145,213]
        //**TODO** implement override
    }else{ //default behavior
        var filterLabel = filters[filterKey].label;
        var sel2Data = [{text: filterLabel, children:[]}]; //takes array of facets ['us', 'gb',...] & filterName or select
        for(i=0; i<obj.length; i++){
            var filt_set = {};
            var filt_ID = objKeys[i];
            filt_set["id"] = filt_ID;
            filt_set["text"] = obj[filt_ID];
            filterList[0]["children"].push(filt_set);
        }
    }
    return sel2Data;
}

function setSelect2(s2data){
    $(document).ready(function() {
//        $(".filterInput").select2('focus');
        $(".filterInput").select2({
            multiple: true,
            data: s2data})
        .on('change', function(e){
            //e.value returns value of the selected --> put into URL
            updateFiltersURL(objName, e.val[0]);
        });
    });
}

function updateFiltersURL (filter) { //for countries, take in 'country' etc.
    var filterVal = $('.filterInput').val();
    generateURL(filter, filterVal);//generateURL("country", "US") or generateURL("category_ids", "Automotive")
    filtersCount++;
    filtersHistory[objName]+=1;//**TODO** no longer formatted this way. add to history key in array
    $("#history").append('<div class="filterbox">'+eval(objName)[selectVal]+'</div>');
//    ClearFields();
//    swapView();
}

function generateURL(filter, filterValue) {
    //**TODO** need separate handler for category - if filter is category, parse filter adn filterValue to make sure it's in "category_id" and "123" form.("category"->"ids", "Automotive"->"2")
    if (filtersCount==0) {
    var firstInput = formatNewFilterInput(filter, filterValue);
        if(qHistory.length==0){
        URL = URL+'filters={"$and":['+firstInput+']}';
        }else{
        URL = URL+'&filters={"$and":['+firstInput+']}';
        }
        
    } else if (filters[filter].history.length==0) {
        newFilterInput = formatNewFilterInput(filter, filterValue);
        URL = URL.slice(0, URL.indexOf('filters={"$and":[')+17)+newFilterInput+','+URL.slice(URL.indexOf('filters={"$and":[')+17); 
    
    } else if (filters[filter].history.length>0) {
        filterValue = filterValue.split(' ').join('+');
        URL = URL.split('"'+fName+'":{"$eq"').join('"'+fName+'":{"$in"');
        var firstIndex = URL.indexOf(fName+'":{"$in":')+fName.length+9;
        var closingBraceIndex = URL.slice(firstIndex).indexOf("}}")
        URL = URL.slice(0, firstIndex) + '["' + filterValue + '", ' + URL.slice(firstIndex).slice(0,closingBraceIndex) +']'+ URL.slice(firstIndex).slice(closingBraceIndex);
    }
}

function formatNewFilterInput(filter, input) {
    input = input.split(' ').join('+');
    filter = '"'+filter+'"'; 
    input = '"'+input+'"';
    return '{'+filter+':{"$eq":'+input+'}}';
}
