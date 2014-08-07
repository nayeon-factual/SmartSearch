//**TODO** do not show dropdown until new facets call has been completed
//**TODO** make undo button in case chose wrong filter by mistake. (swapview)
//**TODO** how bad is the update select2data delay

//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(){
    var facetsObject = [];
    var updatedFacetsAPI = updateFacetsAPI();
    $.get(updatedFacetsAPI).done(function (obj){
        var facetsObject = obj.response.data[filterKey];
        var facetsKeys = Object.keys(facetsObject); //
        console.log('facobj'+JSON.stringify(facetsKeys));
        var S2Data = formatSelect2Data(facetsKeys);
        setSelect2(S2Data);
    }); 
}

function updateFacetsAPI(){
    var facetsAPI = 'http://api.v3.factual.com/t/'+table_id+'/facets?select='+filterKey+'&limit=50&KEY='+key;
    //push limit higher than 50 - try a couple hundred
    
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
    return facetsAPI;
}

function formatExistingFilters(){
    var formatted = '{"$and":['
    for(f=0; f<Object.keys(filters).length; f++){
        var currentFilterKey = Object.keys(filters)[f];
        if(currentFilterKey!=filterKey){
            if(filters[currentFilterKey].history.length==1){ 
            formatted+='{"'+currentFilterKey+'":{"$eq":"'+filters[currentFilterKey].history[0]+'"}}, ';
            }else if(filters[currentFilterKey].history.length > 1){
            var historyString = filters[currentFilterKey].history.toString();
            var historyArray = historyString.split(',').join('","');
            formatted+='{"'+currentFilterKey+'":{"$in":["'+historyArray+'"]}}, ';
            }
        }
    }
    formatted = formatted.substring(0,formatted.length-2)
    formatted += ']}'
    return formatted;
}

//Returns correctly formatted data for select2
function formatSelect2Data(facetsArray){
    var filterLabel = filters[filterKey].label;
    var sel2Data = [{text: filterLabel, children:[]}];
    
    if(filterKey=='category_ids'){//facetsArray = ["12","145","213"]
        for(i=0; i<facetsArray.length; i++){
            var cat_set = {};
            var cat_id = facetsArray[i];
            var cat_text = category_ids[cat_id];
            cat_set["id"] = cat_id;
            cat_set["text"] = cat_text;
            sel2Data[0]["children"].push(cat_set);
        }
    }else{ //default behavior
        for(i=0; i<facetsArray.length; i++){
            var filt_set = {};
            var option = facetsArray[i];
            filt_set["id"] = option;
            filt_set["text"] = option;
            sel2Data[0]["children"].push(filt_set);
        }
    }
    console.log(sel2Data);
    return sel2Data;
}

function setSelect2(s2data){
    $(document).ready(function() {
        $(".filterInput").select2({
            multiple: true,
            data: s2data})
        .on('change', function(e){
            updateFiltersURL(e.val[0]);
        });
        $('.filterInput').prev('.select2-container').find('.select2-input').focus();
    });
}

function updateFiltersURL (filterVal) { 
//    var filterVal = $('.filterInput').val(); **TODO** implement handling for when value in inputs is not from dropdown (select2: formatNoMatches)
    generateURL(filterVal);
    filtersCount++;
    filters[filterKey].history.push(filterVal);
    $("#history").append('<div class="filterbox">'+filterKey+': '+filterVal+'</div>');
    filterKey="";
    ClearFields();
    swapView();
}

function generateURL(filterValue) {
    //**TODO** need separate handler for category - if filter is category, parse filter adn filterValue to make sure it's in "category_id" and "123" form.("category"->"ids", "Automotive"->"2")
    if (filtersCount==0) {
    var firstInput = formatNewFilterInput(filterKey, filterValue);
        if(qHistory.length==0){
        URL = URL+'filters={"$and":['+firstInput+']}';
        }else{
        URL = URL+'&filters={"$and":['+firstInput+']}';
        }
        
    } else if (filters[filterKey].history.length==0) {
        newFilterInput = formatNewFilterInput(filterKey, filterValue);
        URL = URL.slice(0, URL.indexOf('filters={"$and":[')+17)+newFilterInput+','+URL.slice(URL.indexOf('filters={"$and":[')+17); 
    
    } else if (filters[filterKey].history.length>0) {
        filterValue = filterValue.split(' ').join('+');
        URL = URL.split('"'+filterKey+'":{"$eq"').join('"'+filterKey+'":{"$in"');
        var firstIndex = URL.indexOf(filterKey+'":{"$in":')+filterKey.length+9;
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
