//Table ID varies depending on desired data set
var table_id = 'places';
var key = 'i9VTDsvooscG7eFQ6ycBX16gwAvLqOVUDv9u2dMh';
var URL = 'http://www.factual.com/data/t/'+table_id+'#';

//Filters holds all appropriate details (label, searchable terms, history) on faceted filters
// {name:{label:"Label", searchable:["name","label","synonyms"], history:["prevsearches"]}}
var filters = {}; 
var filtersCount = 0;
var qHistory = [];
var filterKey = "";

$(function() {$('.searchInput').focus();});
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
                    filters['category_ids'].searchable=["category_ids", "category_labels", "Category"];//adding name and label
                    addSearchableSyns('category_ids');
                    filters["category_ids"]['history']=[];
                }else{
                    filters[fieldName]={};
                    filters[fieldName].label=fieldLabel;
                    filters[fieldName].searchable=[];
                    filters[fieldName].searchable.push(fieldName);
                    filters[fieldName].searchable.push(fieldLabel);
                    addSearchableSyns(fieldName);
                    filters[fieldName].history=[];
                }
            }
        }
    }); //wait to return filters
}

function addSearchableSyns(word){
    var synArray = synonyms[table_id][word];
    for(a=0; a<synArray.length; a++){
        var syn = synArray[a];
        filters[word].searchable.push(syn);
    }
}

function keyPress(){
    console.log(filters);
    //on Enter
    if (event.keyCode == 13) {
        updateqURL();
    //on colon ":"
    }else if(event.keyCode == 186){
        var filterName = $('.searchInput').val();
        if(isSearchable(filterName)){
            $('#categoryLabel').html(filterName+' :');//tolowercase?
            swapView();
            filterKey += getFilterName(filterName);
            setSelect2Data();
//            filterKeyPress(filterKey);
        }else{
            alert("Invalid Filter Name!");
            ClearFields();
        }
    }
}

function filterKeyPress(filterKey){
    $('.filterInput').keypress(function(event){
        //on Enter
        if (event.keyCode == 13) {
        updateFiltersURL(filterKey);
        }
    })

}

function isSearchable(filterName){
    var filterKeys = Object.keys(filters);
    var searchableBool = false;
    for(k=0; k <filterKeys.length; k++) {
        var filterKey = filterKeys[k].toString();
        if(filters[filterKey].searchable.indexOf(filterName)>-1){
            searchableBool = true;
        }
    }
    return searchableBool;
}

function getFilterName(filterName){
    for(k=0; k <Object.keys(filters).length; k++) {
        var filterKey = Object.keys(filters)[k].toString();
        if(filters[filterKey].searchable.indexOf(filterName)>-1){
            return filterKey;
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
        $(function() {$('.searchInput').focus();});
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
    emptyFiltersHistory();
    filtersCount = 0;
    qHistory = [];
    if($('.hiddenToggle').css('display')=='block'){
        swapView();
    }
}

function emptyFiltersHistory(){
    for(i=0; i<Object.keys(filters).length; i++){
        var currentKey = Object.keys(filters)[i];
        filters[currentKey].history=[];
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
