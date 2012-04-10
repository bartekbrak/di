//~ some eraly version, should probably be deleted

// from http://mark.koli.ch/2009/09/05/get-selected-text-javascript.html
// getSelected() was borrowed from CodeToad at
// http://www.codetoad.com/javascript_get_selected_text.asp

var X = 0;
var Y = 0;
var showEntryDiv = '#fly';
var editEntryDiv = '#edit';
var dbDiv = '#db';
var db = 'plenh';
var imediting = false;
var lastHead = '';
var lastDefinition = '';
var lastHeadId = 'new';
var justFinishedEditing = false;
var configDiv = "#config";
// var queryLocation = 'http://localhost/di/query.php';
var queryLocation = 'http://luludia.ugu.pl/test-24-02-2012/query.php';
// var queryLocation = 'http://194.181.14.s4';

$(dbDiv).html(db);
getSelected = function() {
    var t = '';
    if(window.getSelection) {
        t = window.getSelection();
    } else if(document.getSelection) {
        t = document.getSelection();
    } else if(document.selection) {
        t = document.selection.createRange().text;
    }
    return t;
}

//remove unwanted stuff(ugu will send ads along)
parse = function(string) {

}

mouseup = function(e) {
    if(!imediting) {
        // $(editEntryDiv).fadeOut('fast');
    }
    var st = getSelected();
    if(st != '') {
        lastHead = st;
        $.ajax({
            url : queryLocation+'?db=' + db + '&s=' + st + '&action=query',
            type : 'GET',
            success : function(res) {
                if(res.length > 0) {
                    lastHeadId = res.split('###')[1];
                    lastDefinition = res.split('###')[3];
                } else {
                    lastDefinition = '';
                    lastHeadId = 'new';
                }
                $(showEntryDiv).html(lastDefinition);
                $(showEntryDiv).css('top', e.pageY - 20);
                $(showEntryDiv).css('left', e.pageX + 20);

                $(showEntryDiv).fadeIn('fast');
                X = e.pageX;
                Y = e.pageY;
            }
        });
    }
}

$(document).ready(function() {
    $(document).bind("mouseup", mouseup);
});

$('body').mousemove(function() {
    $(showEntryDiv).fadeOut('fast');
    if(justFinishedEditing) {
        $(editEntryDiv).fadeOut('fast');
    }
});


//save an other keypress events
$(window).keypress(function(event) {

    // "e",
    if(event.which == 101) {
        justFinishedEditing = false;
        console.log('edit started');
        $(showEntryDiv).fadeOut('fast');
        var st = getSelected();
        if(st != '') {
            $(editEntryDiv).html('<input id="head" value="' + lastHead + '"/> : <textarea rows="1" cols="30" id="definition">' + lastDefinition + '</textarea> <button id="submit">ok</button>');
            $(editEntryDiv).css('top', Y - 20);
            $(editEntryDiv).css('left', X + 20);
            $(editEntryDiv).fadeIn('fast');
            $("#definition").focus();


        }
        return true;
    }

    //escape, hide edit box
    if(event.keyCode == 27) {
        $('editEntryDiv').fadeOut('fast');
        return true;
    }

    //ctrl+s & enter, save
    if(!(event.which == 115 && event.ctrlKey) && !(event.which == 19) && !(event.which == 13))
        return true;

    //only save when editbox is visible, otherwise do standard browser stuff
    if(!$('#definition').is(":visible"))
        return true;
    $.ajax({
        url : queryLocation+'?db=' + db + '&head=' + encodeURI($('input#head').val()) + '&action=write&id=' + lastHeadId + '&definition=' + encodeURI($('textarea#definition').val()),
        type : 'GET',
        success : function(res) {
            $(editEntryDiv).html(res);
            $(editEntryDiv).css('top', event.pageY - 20);
            $(editEntryDiv).css('left', event.pageX + 20);

            $(showEntryDiv).fadeIn('fast');
            X = e.pageX;
            Y = e.pageY;
        }
    });
    justFinishedEditing = true;
    event.preventDefault();
    return false;

});
