//take in current filterName and sets appropriate select2 data to filterInput field
function setSelect2Data(filterKey){
    var facetsObject = [];
    $.get(updateFacetsAPI(filterKey)).done(function (obj){
        var facetsObject = obj.response.data.country; //object of facets and counts
        var facetsKeys = Object.keys(facetsObject);
        console.log('facobj'+JSON.stringify(facetsKeys));
        var S2Data = formatSelect2Data(facetsKeys, filterKey);
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
        facetsAPI+='&filters=';
        for(key in Object.keys(filters)){
            if(filters[key].history.length>0){
                formatFilters();//**TODO**
            }
        }
    }
    
    return facetsAPI;
}

//returns correctly formatted data for select2
function formatSelect2Data(facetsObj, filterKey){//takes array of facets ['us', 'gb',...]
    if(filterKey=='category_ids'){//obj = [12,145,213]
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

function updateFiltersURL (objName, selectVal) { //for countries, take in countries etc. 
    generateURL(objName, selectVal);
    filtersHistory[objName]+=1;
    filtersCount ++;
    $("#history").append('<div class="filterbox">'+eval(objName)[selectVal]+'</div>');
    ClearFields();
    swapView();
}

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

function formatNewFilterInput(filter, input) {
    input = input.split(' ').join('+');
    filter = '"'+filter+'"'; 
    input = '"'+input+'"';
    return '{'+filter+':{"$eq":'+input+'}}';
}
