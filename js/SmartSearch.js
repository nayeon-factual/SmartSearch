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
makeSchemaCall();
makeReadCall();

function makeSchemaCall() {
    var schemaCall = 'http://api.v3.factual.com/t/'+table_id+'/schema?KEY='+key;
    $.getJSON(schemaCall).done(function (data){
        var fieldsData = data.response.view.fields;
        var stringifiedData = JSON.stringify(fieldsData);
        for(i=0; i<fieldsData.length; i++){
            populateDataGridHeading(fieldsData[i]);
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
//        createGrid();
//        initializeGridHeaders();
//        console.log(filters);
    }); 
}

function addSearchableSyns(word){
    var synArray = synonyms[table_id][word];
    for(a=0; a<synArray.length; a++){
        var syn = synArray[a];
        filters[word].searchable.push(syn);
    }
}

function keyPress(){
    //on Enter
    if (event.keyCode == 13) {
        if($('.searchInput').val()!=""){
            updateqURL();
            makeReadCall();
        }else{
            alert('Empty Search!');
        }
    //on colon ":"
    }else if(event.keyCode == 186){
        var filterName = $('.searchInput').val().toLowerCase();
        if(isSearchable(filterName)){
            filterKey += getFilterName(filterName);
            $('#categoryLabel').html(filterName+' :');//tolowercase?
            //disabled until select2 is done loading
            $('.searchInput').prop('disabled', true);
            setSelect2Data();
        }else{
            alert("Invalid Filter Name!");
            ClearFields();
        }
    }
}

function triggerAfterS2Set(){
    swapView();
    $('.searchInput').prop('disabled', false);
    $('.filterInput').prev('.select2-container').find('.select2-input').keydown(function(e){
        //on Escape, exit filter view
        if(e.keyCode == 27){
            swapView();
            ClearFields();
        }
    });
}

function isSearchable(filterName){
    var filterKeys = Object.keys(filters);
    var searchableBool = false;
    for(k=0; k <filterKeys.length; k++) {
        var currentfiltKey = filterKeys[k].toString();
        if(filters[currentfiltKey].searchable.indexOf(filterName)>-1){
            searchableBool = true;
        }
    }
    return searchableBool;
}

function getFilterName(filterName){
    for(k=0; k <Object.keys(filters).length; k++) {
        var currfiltKey = Object.keys(filters)[k].toString();
        if(filters[currfiltKey].searchable.indexOf(filterName)>-1){
            return currfiltKey;
        }
    }
}

function swapView(){
    if($('.hiddenToggle').css('display')=='none'){
        //Show Filter View
        $('.hiddenToggle').css('display', 'block');
        $('.searchInput').css('display', 'none');
        ClearFields();
        $('.filterInput').prev('.select2-container').find('.select2-input').focus();
        console.log('im focused');
    }else{
        //Close Filter View
        $('.hiddenToggle').css('display', 'none');
        $('.searchInput').css('display', 'block');
        filterKey = "";
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
    $(function() {$('.searchInput').focus();});
    if($('.hiddenToggle').css('display')=='block'){
        swapView();
    }
    makeReadCall();
}

function emptyFiltersHistory(){
    for(i=0; i<Object.keys(filters).length; i++){
        var currentKey = Object.keys(filters)[i];
        filters[currentKey].history=[];
    }
}

function capitalizeThis(word) {
    return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function filterMouseOver(obj){
    var originalContent = obj.innerHTML;
    var originalWidth = $(obj).width();
    $(obj).mouseenter(function(){
        // console.log($(obj));
        // console.log('urlbeforeClick'+URL);
        $(obj).css({
            'opacity':0.5,
            'cursor':'pointer',
            'width':originalWidth,
            'text-align': 'center'
        });
        $(obj).html('Remove?');
    }).mouseleave(function(){
        $(obj).css('opacity',1);
        $(obj).html(originalContent);
    })
}

function removeqFilter(obj){
    var inputToRemove = $(obj).attr('id');
    var qInputToRemove = formatqInput(inputToRemove.toString());
    if(qHistory.length==1){
        URL = URL.replace('q='+qInputToRemove,'');
        if(URL.indexOf('&'>-1)){
            URL = URL.replace('&','');
        }
    }else if(qHistory.length>1){
        if(URL.indexOf('='+qInputToRemove)>-1){
            URL = URL.replace('='+qInputToRemove+',','=');
        }else if(URL.indexOf(','+qInputToRemove)>-1){
            URL = URL.replace(','+qInputToRemove,'');
        }
    }
    qHistory.splice(qHistory.indexOf(qInputToRemove), 1);
    console.log('postremoveurl'+URL);
    $(obj).remove();
    makeReadCall();
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
        qHistory.push(qInput);
        $("#history").append('<div class="filterbox" id="'+searchInput+'" onmouseenter="filterMouseOver(this);" onclick="removeqFilter(this)">'+capitalizeThis(searchInput)+'</div>');
        ClearFields();
}

function formatqInput(i) {
    if(i.match(/\s/g)){
        i = i.split(' ').join('+');
    }
    return '"'+i+'"';
}

function openURL() {
    window.open(URL);
}
