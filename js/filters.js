function updateFacetsAPI(select, qHistory, filtersHistory){//select = (str, field you want to get facets list of) && currentFilters = array of filters that are currently 
    var facetsAPI = 'http://api.v3.factual.com/t/'+table_id+'/facets?select='+select+'&q='+qSearch+'&filters='+filterSearch+'&limit=50&KEY='+key+';
    //can't push limit higher than 50 - yes, try a couple hundred
    //qSearch is str 'starbucks,dunkin'
    //filterSearch is {filterName:filterValue},{more etc}
    return facetsAPI;
}

//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(select){
    var facetsObject = [];
    $.get(updateFacetsAPI).done(function (obj){
        var facetsObject = obj.response.data.select; //object of facets and counts
        var facetsKeys = Object.keys(facetsKeys);
        formatSelect2Data(facetsKeys);
    }); //wait to return facetsObject
    
}

function formatSelect2Data(obj){//takes array of facets ['us', 'gb',...]
    if(select=='category_ids'){//obj = [12,145,213]
        //**TODO** implement override
    }else{ //default behavior
        var sel2Data = [{text: filterName, children:[]}]; //filterName or select
        for(i=0; i<obj.length; i++){
            var filt_set = {};
            var filt_ID = objKeys[i];
            filt_set["id"] = filt_ID;
            filt_set["text"] = obj[filt_ID];
            filterList[0]["children"].push(filt_set);
        }
    }
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
    console.log("called");
    generateURL(objName, selectVal);
    filtersHistory[objName]+=1;
    filtersCount ++;
    $("#history").append('<div class="filterbox">'+eval(objName)[selectVal]+'</div>');
    ClearFields();
    swapView();
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
