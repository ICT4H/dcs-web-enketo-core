function getFormData(data) {
    var formData = new FormData();
    formData.append("form_data", data);
    formData.append("form_code", questionnaire_code);
    return addAttachmentData(formData);
}

function addAttachmentData(formData) {
    var retainFiles = [];
    var mediaInputs = $('form.or input[type="file"]')
    if (!mediaInputs)
        return formData;

    mediaInputs.each(function () {
        var file = this.files[0];
        //Take the latest selected file for upload
        if (file) {
            formData.append(file.name, file);
        }
        if (submissionUpdateUrl) {
            var fileNotChangedDuringEdit = $(this).attr('data-loaded-file-name');
            if (fileNotChangedDuringEdit) {
                retainFiles.push(fileNotChangedDuringEdit);
            }
        }
    });
    if (retainFiles.length > 0)
        formData.append("retain_files", retainFiles);

    return formData;
}

function saveXformSubmission(callback) {
    form.validate();
    if (form.isValid()){
        DW.loading();
        var dataXml = form.getDataStr();
        var saveURL = submissionUpdateUrl || submissionCreateUrl;

        var success = function (data, status) {
            DW.trackEvent('advanced-qns-submission', 'advanced-qns-submission-success');
            if(typeof(callback) == "function")
                callback();
            else
                window.location.reload();
        };

        var error = function(){
            DW.trackEvent('advanced-qns-submission', 'advanced-qns-submission-failure');
        };
        var formData = getFormData(dataXml);
        $.ajax({
            url: saveURL,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: success,
            error: error
        });
    }
}

requirejs( [ 'require-config' ], function( rc ) {
    requirejs( [ 'jquery', 'Modernizr', 'enketo-js/Form', 'file-manager' ],
        function( $, Modernizr, Form, fileManager ) {

        var loadErrors, form;

        //if querystring touch=true is added, override Modernizr
        if ( getURLParameter( 'touch' ) === 'true' ) {
            Modernizr.touch = true;
            $( 'html' ).addClass( 'touch' );
        }

        var $data;
        data = xform_xml.replace( /jr\:template=/gi, 'template=' );
        $data = $( $.parseXML( data ) );
        $($data.find( 'form:eq(0)' )[0]).find("#form-title").remove();

        formStr = ( new XMLSerializer() ).serializeToString( $data.find( 'form:eq(0)' )[ 0 ] );
        modelStr = ( new XMLSerializer() ).serializeToString( $data.find( 'model:eq(0)' )[ 0 ] );

        $( '.form-header' ).after( formStr );
        $("form").trigger("initializePostFormLoadAction");
        initializeForm();
        $("form").trigger("postFormLoadAction");

        //validate handler for validate button
        $( '#validate-form' ).on( 'click', function() {
            saveXformSubmission();
                fileManager.getFiles()
                    .then( function( files ) {
                        console.log( 'media files:', files );
                    } );
        });

        //initialize the form

        function initializeForm() {
            form = new Form( 'form.or:eq(0)', {
                    modelStr: modelStr,
                    instanceStr: dataStrToEdit
                } );
            //for debugging
            window.form = form;
            //initialize form and check for load errors
            loadErrors = form.init();
            if ( loadErrors.length > 0 ) {
                alert( 'loadErrors: ' + loadErrors.join( ', ' ) );
            }
        }

        //get query string parameter

        function getURLParameter( name ) {
            return decodeURI(
                ( RegExp( name + '=' + '(.+?)(&|$)' ).exec( location.search ) || [ , null ] )[ 1 ]
            );
        }
    } )});
