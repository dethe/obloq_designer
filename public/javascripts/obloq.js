var $o = {
    selfurl: function(){
        return location.href.split('#')[0].split('?')[0];
    },
    gethash: function gethash(){
        var h = location.hash;
        if (h && h[0] === '#'){
            return h.slice(1);
        }
        return h;
    },
    getquery: function getquery(){
        var q = location.search;
        if (q.length && q[0] === '?'){
            return q.slice(1);  // common case, but some browsers don't include the "?"
        }
        return q;
    },
    pageid: function(){
        if (location.pathname === '/'){
            return 'home_page';
        }
        return location.pathname.replace('/', '');
    },
    couchbase: function(){
        return $('#couchbase').attr('href');
    },
    tabselect: function(name){
        var e;
        $('.tab').each(function(idx, elem){
            var e = $(elem);
            var tabname = $o.tabname(e);
            if (tabname === name){
                e.addClass('selected');
                $('.tabcontent.' + tabname).show();
            }else{
                e.removeClass('selected');
                $('.' + tabname).hide();
            }
        });
        location.hash = '#' + name;
        // also set all nav urls to have the hash, so we stay in the same view between pages
        $('.nav li a.view').attr('href', function(idx, oldvalue){
            return oldvalue.split('#')[0] + '#' + name;
        });
    },
    tabname: function(elem){
        return $(elem).closest('li').find('a').attr('href').slice(1);
    },
    tabinit: function(evt){
        evt.preventDefault();
        var tabname = $o.gethash() || 'context';
        $o.tabselect(tabname);
    },
    tabclick: function(evt){
        evt.preventDefault();
        var tabname = $o.tabname(evt.target);
        $o.tabselect(tabname);
        return false;
    },
    editmode: function(evt){
        evt.preventDefault(evt);
        var container = $(evt.target).closest('.mod');
        if (container.is('.tabcontent')){
            container = container.parent().closest('.mod');
        }
        container.find('.edit').show();
        container.find('.view.editaction').hide();
    },
    viewmode: function(evt){
        evt.preventDefault();
        var container = $(evt.target).closest('.mod');
        if (container.is('.tabcontent')){
            container = container.parent().closest('.mod');
        }
        container.find('.edit').hide();
        container.find('.view.editaction').show();
    },
    savedata: function(evt){
        var savedata = {}, field;
        $.each(['context', 'wireframes', 'behaviour', 'code'], function(idx, name){
            field = name + '_text';
            savedata[field] = $('#' + field).val();
        });
        $.post($o.selfurl(), savedata, function(){location.reload();});
        $o.viewmode(evt);
    },
    deletedata: function(evt){
        alert('delete the data');
        $o.viewmode();
    },
    addattachment: function(filename){
        var href = [$o.couchbase(), $o.pageid(), filename].join('/'); 
        $('#attachments').append('<li class="attachment"><a href="' + href + '">' + filename + '</a><a class="deleteaction" href="#">delete</a>');
    }
};

$(function(){
    $(window).load($o.tabinit);
    $('.tab').click($o.tabclick);
    $('.editaction').live('click', $o.editmode);
    $('.saveaction').live('click', $o.savedata);
    $('.cancelaction').live('click', $o.viewmode);
    $('.deleteaction').live('click', $o.deletedata);
    new AjaxUpload('loadaction', {action: $o.selfurl(), onComplete: function(file, response){
        $o.addattachment(file);
    }});
    // $('.loadaction').live('click', $o.loadaction);
});