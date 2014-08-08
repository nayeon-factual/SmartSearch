//**TODO** do not show dropdown until new facets call has been completed
//**TODO** make undo button in case chose wrong filter by mistake. (swapview)
//**TODO** how bad is the update select2data delay
//**TODO** take a look at setSelect2.on('change') - the looping twice is weird. 
//**TODO** handling capitalization things: updated history should look more refined, inputs can be in upper or lower cases
//**TODO** set locality first limits region. is this intuitive behavior?

//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(){
    var facetsObject = [];
    var updatedFacetsAPI = updateFacetsAPI();
    console.log('updatedFacAPI '+updatedFacetsAPI)
    $.get(updatedFacetsAPI).done(function (obj){
        console.log('got facets API');
        var facetsObject = obj.response.data[filterKey];
        var facetsKeys = Object.keys(facetsObject); //
        console.log('facobj'+JSON.stringify(facetsKeys));
        var S2Data = formatSelect2Data(facetsKeys);
        setSelect2(S2Data);
        triggerAfterS2Set();
    }); 
}

function updateFacetsAPI(){
    var facetsAPI = 'http://api.v3.factual.com/t/'+table_id+'/facets?select='+filterKey+'&limit=100&KEY='+key;
    
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
    return sel2Data;
}

function setSelect2(s2data){
    $(document).ready(function() {
        $(".filterInput").select2({
            containerCssClass:'s2Container',
            dropdownCssClass:'s2DropDown',
            multiple: true,
            data: s2data,
//            formatNoMatches: function(term) {//**TODO** 
//                $(".select2-input").keyup(function(event){
//                    if (event.keyCode == 13) {
//                        console.log(term);
//                    }else{
//                    }
//                });
////                console.log(finalTerm);
//            }
            })
        .on('change', function(e){
            if(filterKey!=""){
            updateFiltersURL(e.val[0]);
            }
        });
        $('.filterInput').prev('.select2-container').find('.select2-input').focus();
    });
}

function updateFiltersURL (filterVal) { 
    ClearFields();
    generateURL(filterVal);
    filtersCount++;
    filters[filterKey].history.push(filterVal);
    updateHistory(filterVal);
    filterKey="";
    swapView();
}

function updateHistory(filterVal) {
    if(filterKey=="category_ids"){
        $("#history").append('<div class="filterbox"> Category: '+category_ids[filterVal]+'</div>');
    }else{
        $("#history").append('<div class="filterbox">'+filterKey+': '+filterVal+'</div>');
    }
}

function generateURL(filterValue) {
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
