var defaultDb = '_test',
    X = 0,
    Y = 0,
    showEntryDiv = '#fly',
    editEntryDiv = '#edit',
    dbDiv = '#db',
    imediting = false,
    lastHead = '',
    lastDefinition = '',
    justFinishedEditing = false,
    configDiv = "#config",
    queryLocation = 'http://luludia.ugu.pl/di/json.php',
    alternator = -1,
    minimumSelectedTextLength = 2,
    maximumSelectedTextLength = 50,
    selectedText = '',
    db = defaultDb,
    htmlToInsert = '',
    currentDbEditable = false,
    password = 'test'

processQueryResponse = function (data) {
    if (data.definitions.length == 0) {
        lastHead = selectedText
        lastDefinition = ''
        // return true // uncomment to not display the fly with a question mark
        htmlToInsert = '?'
    } else if ((data.definitions.length == 1 && data.definitions[0].string == selectedText.toLowerCase())) {
        htmlToInsert = data.definitions[0].definition
        lastHead = selectedText
        lastDefinition = htmlToInsert
    } else {
        htmlToInsert = ''
        for (var key in data.definitions) {
            htmlToInsert += "<b>" + data.definitions[key].string + "</b> " + data.definitions[key].definition + "<br/>"
            lastHead = data.definitions[key].string
            lastDefinition = data.definitions[key].definition
        }
    }
    $(showEntryDiv).html(htmlToInsert);
    $(showEntryDiv).css('top', Y - 10)
    $(showEntryDiv).css('left', X + 20)
    $(showEntryDiv).fadeIn('fast')
}

getSelected = function () {
    var t = '';
    if (window.getSelection) {
        t = window.getSelection()
    } else if (document.getSelection) {
        t = document.getSelection()
    } else if (document.selection) {
        t = document.selection.createRange().text
    }
    //ponizej jest hack na dwa typy apostrofów, to trzeba kiedys poprawic na bardziej poprawne rozwiazanie
    return String($.trim(t).replace("’", "'"))
}
lookUpSelectedText = function (e) {
    if (!$(editEntryDiv).is(":visible")) {
        selectedText = getSelected()
        //that's for editbox that can't get its own x&y
        Y = e.pageY
        X = e.pageX
        if (selectedText.length >= minimumSelectedTextLength && selectedText.length <= maximumSelectedTextLength && $('#isOn').attr('checked')) {
            $.ajax({
                url:queryLocation,
                data:{
                    string:selectedText,
                    action:'query',
                    db:db
                },
                dataType:'jsonp',
                jsonp:'callback',
                jsonpCallback:'processQueryResponse',
                success:function () {
                }
            })
        }
    }
}
processRefreshEditBoxResponse = function (data) {
    if (data.definitions.length == 1) $('#definition').val(data.definitions[0].definition)
    else if (data.definitions.length > 1) alert('something bad is going on - ' + $('#head').html() + " There is more than one entry in the table for this query. Report that.")
    else if (data.definitions.length == 0) $('#definition').val('')

    $('#definition').removeAttr('disabled');
    $("#definition").focus()
}
//triggered after user changes head form in the edit box
refreshEditBox = function () {
    $('#definition').attr('disabled', 'disabled');
    $('#before').fadeOut('fast', function () {
        $('#before').html('')
        $('#before').show()
    })
    $.ajax({
        url:queryLocation,
        data:{
            string:encodeURIComponent($('#head').val()),
            action:'query',
            db:db,
            raw:'1'
        },
        dataType:'jsonp',
        jsonp:'callback',
        jsonpCallback:'processRefreshEditBoxResponse',
        success:function () {
        }
    })

}

processTestPasswordResponse = function (data) {
    currentDbEditable = data.currentDbEditable
//        alert(currentDbEditable)
}

setEditing = function () {
    //test the password and enable editing if correct, for home-grwon hackers: don't waste your time tampering with this,
    //the password is checked with every save to the db in the backend, this is only for the interface
    $.ajax({
        url:queryLocation,
        data:{
            action:'test_password',
            db:db,
            password:password
        },
        dataType:'jsonp',
        jsonp:'callback',
        jsonpCallback:'processTestPasswordResponse',
        success:function () {
        }
    })
}


$(document).ready(function () {
    setEditing()
    $(document).bind("mouseup", lookUpSelectedText)
    htmlToAppend = '' +
        '<div id="fly"></div>' +
        '<div id="edit">' +
        '<span id="before"></span>' +
        '&nbsp;' +
        '<input id="head" value=""/> : ' +
        '<textarea rows="1" cols="30" id="definition"></textarea>' +
        '</div>' +
        '<div id="config">' +
        //                    '<div id="tablesHeader">słowniki</div>' +
        //                    '<div id="tablesBody"></div>' +
        //                    '<hr/>' +
        '<label for="isOn"></label><input type="checkbox" checked="checked" id="isOn"">&nbsp;włączony' +
        '<div id="toggleControls"></div>' +
        '<br/>' +
        '<a href="mailto:bartek.rychlicki@gmail.com?subject=Słownik%20&amp;body=Cześć">feedback</a>' +
        '</div>'
    $('body').append(htmlToAppend)
    //hide edit box after editing
    $('body').mousemove(function () {
        if ($(showEntryDiv).is(":visible"))
            $(showEntryDiv).fadeOut('fast')
        if (justFinishedEditing) {
            $(editEntryDiv).fadeOut('fast')
            $('#definition').val('');
            $('#head').val('');
            $('#before').html('')
        }
    })
    $("#toggleControls").click(function () {
        //UI, pops in and out the config box
        alternator = alternator * -1
        moveme = ($(configDiv).width() + 25) * alternator
        $("#config").animate({
            "left":"-=" + moveme + "px"
        }, "fast")
    })
    $('#head').bind('focusout', refreshEditBox)

    //save and other keypress events
    $(window).keyup(function (event) {
        if (event.which == 69 && currentDbEditable) {
            //reset the form
            $('#definition').removeAttr('disabled');
            $('#head').removeAttr('disabled');
            justFinishedEditing = false
            $(showEntryDiv).fadeOut('fast')
            var selectedText = getSelected()
            if (selectedText.length > minimumSelectedTextLength && selectedText.length < maximumSelectedTextLength && $('#isOn').attr('checked')) {
                // $("#hid").html(lastHeadId)
                $("#head").val(selectedText.toLowerCase())
                refreshEditBox()

                $(editEntryDiv).css('top', Y - 20)
                $(editEntryDiv).css('left', X + 20)
                $(editEntryDiv).fadeIn('fast')
                $("#definition").focus()

            }
            return true
        }

        //escape, hide edit box
        if (event.keyCode == 27) {
            $(editEntryDiv).fadeOut('fast');
            return true
        }

        //don't save if the user is editing word form, #definition will only be reloaded after it looses it
        if ($("#head").is(":focus"))
            return true
        if (!(event.which == 13))
            return true
        if (!$('#definition').is(":visible"))
            return true;

        $('#head').attr('disabled', 'disabled')
        $('#definition').attr('disabled', 'disabled')
        $.ajax({
            url:queryLocation,
            data:{
                action:'write',
                db:db,
                string:$('input#head').val(),
                password:password,
                definition:encodeURIComponent($('textarea#definition').val())
            },
            dataType:'jsonp',
            jsonp:'callback',
            jsonpCallback:'processWriteResponse',
            success:function () {
            }
        })


        if (event.ctrlKey) {
            $('#head').removeAttr('disabled')
            $('#definition').removeAttr('disabled')
            //focus and move carret to the end
            $("#head").focus()
            var v = $("#head").val();
            $("#head").val('');
            $("#head").val(v);
        } else {
            justFinishedEditing = true
        }
        event.preventDefault()
        return false

    })

    $("#toggleControls").click()
})
processWriteResponse = function (data) {
    $('#before').html(decodeURIComponent(data.responseMessage))
}
