//**TODO** handling colon in keyword
//**TODO** take a look at setSelect2.on('change') - the looping twice is weird. 

//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(){
    var facetsObject = [];
    var updatedFacetsAPI = updateFacetsAPI();
    $.get(updatedFacetsAPI).done(function (obj){
        var facetsObject = obj.response.data[filterKey];
        var facetsKeys = Object.keys(facetsObject); //
//        console.log('array of dropdown content '+JSON.stringify(facetsKeys));
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
        if(filtersCount==filters[filterKey].history.length){
        }else{
        var formattedFilters = formatExistingFilters();
        facetsAPI+='&filters='+formattedFilters;
        }
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
            tags: s2data[0]['children']
        })

        .on('select2-focus', select2Focus).on("select2-blur", function () {
            $(this).one('select2-focus', select2Focus)
        })

        .on('change', function(e){
            if(filterKey!=""){
            updateFiltersURL(e.val[0]);
            }
        });
    });
}

function select2Focus() {
    if(filterKey=='category_ids'){
        $(this).select2('open');
    }
}

function updateFiltersURL(filterVal) { 
    ClearFields();
    generateURL(filterVal);
    makeReadCall();
    filtersCount++;
    filters[filterKey].history.push(filterVal);
    updateHistory(filterVal);
    swapView();
    filterKey="";
}

function updateHistory(filterVal) {
    var newfilterVal = capitalizeThis(filterVal);
    if(filterKey=="category_ids"){
        $("#history").append('<div class="filterbox" id="category_ids'+'__'+filterVal+'" onmouseenter="filterMouseOver(this);" onclick="removeCategorizedFilter(this)"> <span id=filterLabel>Category:</span> '+category_ids[newfilterVal]+'<div id=removeDiv> × </div></div>');
    }else{
        $("#history").append('<div class="filterbox" id="'+filterKey+'__'+filterVal+'" onmouseenter="filterMouseOver(this);"onclick="removeCategorizedFilter(this)"><span id=filterLabel>'+filterKey+':</span> '+newfilterVal+'<div id=removeDiv> × </div></div>');
    }
}

function removeCategorizedFilter(obj){
    var inputToRemove = $(obj).attr('id');
    var keyToRemove = inputToRemove.slice(0,inputToRemove.indexOf('__'));
    var valToRemove = inputToRemove.slice(inputToRemove.indexOf('__')+2);
    var formattedValToRemove = valToRemove.split(' ').join('+');
    var historyOfKey = filters[keyToRemove].history;

    var openBraceIndex = URL.indexOf('{"'+keyToRemove+'":');
    var closingBraceIndex = URL.indexOf('}',URL.indexOf('{"'+keyToRemove+'"'))+1;
    var filterBrace = URL.substring(openBraceIndex,closingBraceIndex+1);
    
    if(historyOfKey.length==1){

        URL = URL.replace(filterBrace,'').replace('[,','[').replace(',,',',').replace(',]',']');

        URL = URL.replace('filters={"$and":[]}','');
        URL = URL.replace('&q=','q=');
        console.log(URL);

    }else if(historyOfKey.length==2){

        console.log(filterBrace);
        var newfilterBrace = filterBrace.replace('"'+formattedValToRemove+'"','').replace('$in','$eq').replace(',','').replace('[','').replace(']','');
        URL = URL.replace(filterBrace,newfilterBrace)
        console.log(URL);

    }else if(historyOfKey.length>2){
        console.log(filterBrace);
        var filterBracket = filterBrace.substring(filterBrace.indexOf('['),filterBrace.indexOf(']')+1);
        var newfilterBracket = filterBracket.replace('"'+formattedValToRemove+'"','');
        newfilterBracket = newfilterBracket.replace(/\s+/g, '').replace('[,','[').replace(',,',',').replace(',]',']');
        URL = URL.replace(filterBracket,newfilterBracket);
        console.log(URL);
    }
    
    historyOfKey.splice(historyOfKey.indexOf(valToRemove), 1);
    filtersCount -= 1;
    $(obj).remove();
    makeReadCall();
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
        if(filters[filterKey].history.length==1) {
            URL = URL.split('"'+filterKey+'":{"$eq"').join('"'+filterKey+'":{"$in"');
            var firstIndex = URL.indexOf(filterKey+'":{"$in":')+filterKey.length+9;
            var closingBraceIndex = URL.slice(firstIndex).indexOf("}}");
            URL = URL.slice(0, firstIndex) + '["' + filterValue + '", ' + URL.slice(firstIndex).slice(0,closingBraceIndex) +']'+ URL.slice(firstIndex).slice(closingBraceIndex);
        }else if(filters[filterKey].history.length>1) {
            var firstIndex = URL.indexOf(filterKey+'":{"$in":')+filterKey.length+10;
            var closingBraceIndex = URL.slice(firstIndex).indexOf("}}")
            URL = URL.slice(0, firstIndex) + '"'+ filterValue + '", ' + URL.slice(firstIndex).slice(0,closingBraceIndex)+ URL.slice(firstIndex).slice(closingBraceIndex);
        }
    }
}

function formatNewFilterInput(filter, input) {
    input = input.split(' ').join('+');
    filter = '"'+filter+'"'; 
    input = '"'+input+'"';
    return '{'+filter+':{"$eq":'+input+'}}';
}
