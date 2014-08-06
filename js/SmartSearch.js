//Table ID varies depending on desired data set
var table_id = 'places-us';
var key = 'i9VTDsvooscG7eFQ6ycBX16gwAvLqOVUDv9u2dMh';
var URL = 'http://www.factual.com/data/t/'+table_id+'#';

//Filters holds all appropriate details (label, searchable terms, history) on faceted filters
// {name:{label:"Label", searchable:["name","label","synonyms"], history:["prevsearches"]}}
var filters = {}; 
var filtersCount = 0;
var qHistory = [];

initializeFilters();

function initializeFilters() {
    var schemaCall = 'http://api.v3.factual.com/t/'+table_id+'/schema?KEY='+key;
    $.getJSON(schemaCall).done(function (data){
        var fieldsData = data.response.view.fields;
        var stringifiedData = JSON.stringify(fieldsData);
        for(i=0; i<fieldsData.length; i++){
            if(fieldsData[i].faceted==true){
                var fieldName = fieldsData[i].name.toString();
                var fieldLabel = fieldsData[i].label.toString();
                if(fieldName=="category_ids" || fieldName=="category_labels"){
                    filters['category_ids']={};
                    filters['category_ids'].label="Category";
                    filters['category_ids'].searchable=["category", "category label", "category name"];
                    //**TODO** depends on synonyms format
                    filters["category_ids"].searchable.push(findSearchableSyn("category"));
                    filters["category_ids"]['history']=[];
                }else{
                    filters[fieldName]={};
                    filters[fieldName].label=fieldLabel;
                    filters[fieldName].searchable=[];
                    filters[fieldName].searchable.push(fieldName);
                    filters[fieldName].searchable.push(fieldLabel);
                    filters[fieldName].searchable.push(findSearchableSyn(fieldName));
                    filters[fieldName].history=[];
                }
            }
        }
    }); //wait to return searchable
}

function findSearchableSyn(word){
//    for(word in searchable){
//        //**TODO** synonyms should be a js object mapping words to their synonyms
//    }
}//returns "'syn', 'syn', 'syn'"

function keyPress(){
    //on Enter
    if (event.keyCode == 13) {
        updateqURL();
    //on colon ":"
    }else if(event.keyCode == 186){
        var filterName = $('.searchInput').val();
        if(isSearchable(filterName)){
            $('#categoryLabel').html(filterName+' :');//tolowercase?
            swapView();
            var filterKey = getFilterName(filterName);
            setSelect2Data(filterKey);
        }else{
            ClearFields();
            alert("Invalid Filter Name!");
        }
    }
}

function isSearchable(filterName){
    for(key in Object.keys(filters)) {
        if(filterName in filters[key].searchable){
            return true;
        }else{
            return false;
        }
    }
}

function getFilterName(filterName){
    for(key in Object.keys(filters)) {
        if(filterName in filters[key].searchable){
            return key;
        }
    }
}

function swapView(){
    if($('.hiddenToggle').css('display')=='none'){
        //Show Filter View
        $('.hiddenToggle').css('display', 'block');
        $('.searchInput').css('display', 'none');
    }else{
        //Close Filter View
        $('.hiddenToggle').css('display', 'none');
        $('.searchInput').css('display', 'block');
    }
    //**TODO** add red/green filter color based on facetable filter
}
                                  
function ClearFields() {
     $(".searchInput").val('');
     $(".filterInput").select2("val", "");
}

function reset() {
    URL = 'http://www.factual.com/data/t/'+table_id+'#';
    $("#history").empty();
    filtersHistory = {country:0, region:0, locality:0, post_town:0, category_id:0, chain_name:0};//**TODO** make function to empty all arrays
    filtersCount = 0;
    qHistory = [];
    if($('.hiddenToggle').css('display')=='block'){
        swapView();
    }
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
        qHistory.push(qInput); //**TODO** push qInput or searchInput? (what does facets call take)
        $("#history").append('<div class="filterbox">'+searchInput+'</div>');
        ClearFields();
}

function formatqInput(i) {
    i = i.split(' ').join('+');
    i = '"'+i+'"';
    return i;
}

function openURL() {
    window.open(URL);
}
