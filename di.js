// ==UserScript==
// @id             8721382
// @name           di
// @version        1.1
// @namespace
// @author         bartek
// @description    opis
// @include        /^https?:\/\/(www\.)?dw\.de.*/
// @include        /^https?:\/\/(www\.)?zeit\.de.*/
// @exclude        diki.pl
// @exclude        /^https?:\/\/(www\.)?google\..*/
// @run-at         document-end
// @require        http://code.jquery.com/jquery-latest.pack.js
// ==/UserScript==

db = 'de_pl'
password  = 'hochsen'

//it shouldn't be necessary to edit below this line
////////////////////////////////////////////////////////
if (window === top) {

if (typeof db === 'undefined' || typeof password === 'undefined' ) {
    alert('define db and/or password in the script file')
    throw new Error()
}


    var X = 0,
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
        htmlToInsert = '',
        currentDbEditable = false,
        styleString = 'p.crowParagraph {  padding:0px;    margin:0px; padding-left:10px;}#fly, #edit, #config, #definition, #head {    font-family : Arial, sans-serif;    margin      : 0px;    font-size   : 14px;}#fly, #edit, #config {    position      : absolute;    border-radius : 15px;    padding       : 10px;    display       : none;    z-index       : 666;}#fly {    background-color : #0fa;    max-width        : 600px;    opacity          : 0.9;}#edit {    background-color : #faa;    opacity          : 0.95;    z-index          : 667;}#config {    background-color : #aaf;    position         : fixed;    opacity          : 0.95;    left             : 15px;    bottom           : 15px;    display          : block;}#head {    width : 100px;}#definition {    width : 300px;}#definition, #head {    height         : 25px;    border         : 1px solid black;    margin         : 0px;    padding        : 2px;    vertical-align : top;    line-height    : 25px;    overflow       : hidden;}#before {    line-height : 25px;    opacity     : 0.4;    font-size   : 8px}#toggleControls {    width            : 10px;    height           : 10px;    background-color : black;    opacity          : 0.5;    position         : absolute;    right            : 0px;    bottom           : 10px;    font-size        : 10px;    line-height      : 10px;    cursor           : pointer}HR {    margin      : 0px;    line-height : 5px;    color       : black;    opacity     : 0.5;    width       : 80%;}#isOn {    vertical-align : middle;}'




        processQueryResponse = function(data) {
            if (data.definitions.length === 0) {
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
                    htmlToInsert += '<b>' + data.definitions[key].string + '</b><p class="crowParagraph">' + data.definitions[key].definition + '</p>'
                    lastHead = data.definitions[key].string
                    lastDefinition = data.definitions[key].definition
                }
            }
            $(showEntryDiv).html(htmlToInsert);
            $(showEntryDiv).css('top', Y - 10)
            $(showEntryDiv).css('left', X + 20)
            $(showEntryDiv).fadeIn('fast')
            $("body").css("cursor", "auto")

        }
    getSelected = function() {
        var t = ''
        if (window.getSelection) {
            t = window.getSelection()
        } else if (document.getSelection) {
            t = document.getSelection()
        } else if (document.selection) {
            t = document.selection.createRange().text
        } else {
            t = ''
        }
        return String($.trim(t).replace("’", "'"))
    }
    lookUpSelectedText = function(event) {
        if (event.ctrlKey) {
            lookUpClickedText(event)
        }
        event.preventDefault()
    }
    lookUpClickedText = function(e) {
        if (!$(editEntryDiv).is(":visible")) {
            selectedText = getSelected()
            //that's for editbox that can't get its own x&y
            Y = e.pageY
            X = e.pageX
            if (
            selectedText.length >= minimumSelectedTextLength && selectedText.length <= maximumSelectedTextLength && $('#isOn').attr('checked')) {
                $("body").css("cursor", "progress")
                if (GM_enabled) {
                    GM_xmlhttpRequest({
                        url: queryLocation + '?action=query&db=' + db + '&string=' + selectedText,
                        onload: function(res) {
                            processQueryResponse(res.responseJSON)
                        }
                    })
                } else {
                    $.ajax({
                        url: queryLocation,
                        data: {
                            string: selectedText,
                            action: 'query',
                            db: db
                        },
                        dataType: 'jsonp',
                        jsonp: 'callback',
                        jsonpCallback: 'processQueryResponse',
                        success: function() {}
                    })
                }
            }
        }
        e.preventDefault()
        return false;
    }
    processRefreshEditBoxResponse = function(data2) {
        if (data2.definitions.length == 1) {
            $('#definition').val(data2.definitions[0].definition)
        } else if (data2.definitions.length > 1) {
            alert('something bad is going on - ' + $('#head').html() + " There is more than one entry in the table for this query. Report that.")
        } else if (data2.definitions.length === 0) {
            $('#definition').val('')
        }
        $('#definition').removeAttr('disabled');
        $("#definition").focus()
        $("body").css("cursor", "auto")
    }
    //triggered after user changes head form in the edit box
    refreshEditBox = function() {
        var string = $('#head').val()
        $("body").css("cursor", "progress")
        $('#definition').attr('disabled', 'disabled');
        $('#before').fadeOut('fast', function() {
            $('#before').html('')
            $('#before').show()
        })
        if (GM_enabled) {
            GM_xmlhttpRequest({
                url: queryLocation + '?action=query&raw=1&db=' + db + '&string=' + string,
                onload: function(res) {
                    processRefreshEditBoxResponse(res.responseJSON)
                }
            })
        } else {
            $.ajax({
                url: queryLocation,
                data: {
                    string: string,
                    action: 'query',
                    db: db,
                    raw: '1'
                },
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'processRefreshEditBoxResponse',
                success: function() {}
            })

        }
    }
    processTestPasswordResponse = function(data3) {
        currentDbEditable = data3.currentDbEditable
    }


    setEditing = function() {
        //test the password and enable editing if correct, for home-grwon hackers: don't waste your time tampering with this,
        //the password is checked with every save to the db in the backend, this is only for the interface
        if (GM_enabled) {
            GM_xmlhttpRequest({
                url: queryLocation + '?action=test_password&db=' + db + '&password=' + password,
                onload: function(res) {
                    processTestPasswordResponse(res.responseJSON)
                }
            })
        } else {
            $.ajax({
                url: queryLocation,
                data: {
                    action: 'test_password',
                    db: db,
                    password: password
                },
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'processTestPasswordResponse',
                success: function() {}
            })
        }
    }

    $(document).ready(function() {

        GM_enabled = (typeof GM_xmlhttpRequest == 'function') ? true : false //check whether I'm in Greasemonkey or standalone version
        if (GM_enabled) {GM_addStyle(styleString)} else {
            var css = document.createElement("style");
            css.type = "text/css";
            css.innerHTML = styleString;
            document.body.appendChild(css);
        }
        setEditing()
        $(document).bind("dblclick", lookUpClickedText)
        $(document).bind("mouseup", lookUpSelectedText)
        htmlToAppend = '' + '<div id="fly"></div>' + '<div id="edit">' + '<span id="before"></span>' + '&nbsp;' + '<input id="head" value=""/> : ' + '<textarea rows="1" cols="30" id="definition"></textarea>' + '</div>' + '<div id="config">' +
        //                    '<div id="tablesHeader">słowniki</div>' +
        //                    '<div id="tablesBody"></div>' +
        //                    '<hr/>' +
        '<label for="isOn"></label><input type="checkbox" checked="checked" id="isOn"">on / off' + '<div id="toggleControls"></div>' + '<br/>' + '<a href="mailto:bartek.rychlicki@gmail.com?subject=Słownik%20&amp;body=Cześć">e-mail author</a>&nbsp;&nbsp;' + '</div>'
        $('body').append(htmlToAppend)
        //hide edit box after editing
        $('body').mousemove(function() { // .click | .mousemove
            if ($(showEntryDiv).is(":visible")) {
                $(showEntryDiv).fadeOut('fast')
            }
            if (justFinishedEditing) {
                $(editEntryDiv).fadeOut('fast')
                $('#definition').val('');
                $('#head').val('');
                $('#before').html('')
            }
        })
        $("#toggleControls").click(function() {
            //UI, pops in and out the config box
            alternator = alternator * -1
            moveme = ($(configDiv).width() + 25) * alternator
            $("#config").animate({
                "left": "-=" + moveme + "px"
            }, "fast")
        })
        $('#head').bind('focusout', refreshEditBox)

        //save and other keypress events
        $(window).keydown(function(event) {
            // e
            if (event.which == 69 && currentDbEditable) {
                //reset the form
                $('#definition').html('').removeAttr('disabled');
                $('#head').html('').removeAttr('disabled');
                justFinishedEditing = false
                $(showEntryDiv).fadeOut('fast')
                var selectedText = getSelected()
                if (selectedText.length > minimumSelectedTextLength && selectedText.length < maximumSelectedTextLength && $('#isOn').attr('checked')) {
                    $("#head").val(selectedText) //or .toLowerCase()
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
            if ($("#head").is(":focus")) {
                return true
            }
            if (!(event.which == 13)) {
                return true
            }
            if (!$('#definition').is(":visible")) {
                return true
            }
            $("body").css("cursor", "progress")
            $('#head').attr('disabled', 'disabled')
            $('#definition').attr('disabled', 'disabled')
            if (GM_enabled) {
                GM_xmlhttpRequest({
                    url: queryLocation + '?action=write&db=' + db + '&password=' + password + '&string=' + $('input#head').val() + '&definition=' + $('textarea#definition').val(),
                    onload: function(res) {
                        processWriteResponse(res.responseJSON)
                    }
                })
            } else {
                $.ajax({
                    url: queryLocation,
                    data: {
                        action: 'write',
                        db: db,
                        string: $('input#head').val(),
                        password: password,
                        definition: $('textarea#definition').val()
                    },
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    jsonpCallback: 'processWriteResponse',
                    success: function() {}
                })
            }
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

        }) //EO $(window).keydown
        $("#toggleControls").click()

    }) //EO $(document).ready
    processWriteResponse = function(data4) {
        $('#before').html(decodeURIComponent(data4.responseMessage))
        $("body").css("cursor", "auto")
    }
} // EO if (window === top)
