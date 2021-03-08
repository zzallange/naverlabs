function Swipe(container, options)
{
    "use strict";

    // quit if no root element
    if ( $(container).length <= 0 ) return ;

    //$(container).hide() ;
    $(container).css('overflow', 'hidden') ;
    $(container).css('position', 'relative') ;
    $(container).children(0).css('overflow', 'hidden') ;
    $(container).children(0).css('position', 'relative') ;

    // check browser capabilities
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function(temp) {
        var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
        for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
        return false;
        })(document.createElement('swipe'))
    };

    // quit if no root element
    var element = $(container).children(0);

    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    if( options.cookie && $.cookie( 'swipe' + $(container).attr('id') ) )  index = parseInt( $.cookie( 'swipe' + $(container).attr('id')), 10 ) ;

    var speed = options.speed || 300;
    options.continuous = options.continuous !== undefined ? options.continuous : true;

    var fittable = options.fittable || false ;
   var fittablemargin = options.fittablemargin || 0 ;
   
    var delay = options.auto || 0;
    var interval;

    // cache slides
    slides = $(element).children();
    length = $(slides).length;

    function begin()
    {
        if ( options.auto )
        {
            delay = options.auto || 0;
            interval = setInterval(next, delay);
        }
    }

    function stop()
    {
        delay = 0;
        try {
            clearInterval(interval);
        } catch (e) {}
    }

    function setup()
    {
        // set continuous to false if only one slide
        if ($(slides).length < 2) options.continuous = false;
        //special case if two slides
        else if (browser.transitions && options.continuous && $(slides).length < 3)
        {
            $(element).append( $(slides).eq(0).clone(true) );
            $(element).append( $(element).children().eq(1).clone(true) );
            slides = $(element).children();
            try {
                if ( options.datas[0] ) options.datas[2] = options.datas[0] ;
                if ( options.datas[1] ) options.datas[3] = options.datas[1] ;
            } catch(e) {}
        }

        // create an array to store current positions of each slide
        slidePos = new Array($(slides).length);

        // determine width of each slide
        //if ( options.width ) width = options.width ;
        //else width =  $(container).width() ||  $(container).outerwidth() ;
        width =  $(container).width() ;

        $(element).width( $(slides).length * width ) ;

        // stack elements
        var pos = $(slides).length;
        while(pos--)
        {
            var slide = $(slides).eq(pos);

            $(slide).css( 'float', 'left' ) ;
            $(slide).css( 'position', 'relative' ) ;
            if ( $.trim($(slide).html()) == '' ) $(slide).html('blank') ;

            $(slide).width( width ) ;
            $(slide).attr('data-index', pos);
            if (browser.transitions)
            {
                $(slide).css( 'left', pos * -width ) ;
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }
        }

        // reposition elements before and after index
        if (options.continuous && browser.transitions)
        {
            move(circle(index-1), -width, 0);
            move(circle(index+1), width, 0);
        }
        if (!browser.transitions)
        {
            $(element).css ( 'left', index * -width ) ;
        }
        $(container).show() ;

        finalHandle(index, 'init') ;

        $( document ).on({keyup:function(event){keyupHandle(event);}}) ;
    }

    var noop = function() {}; // simple no operation function
    var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

    function slide(to, slideSpeed)
    {
        // do nothing if already on requested slide
        if (index == to) return;

        offloadFn(options.prepare && options.prepare(index, slides[index]));

        if (browser.transitions)
        {
            var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

            // get the actual position of the slide
            if (options.continuous)
            {
                var natural_direction = direction;
                direction = -slidePos[circle(to)] / width;

                // if going forward but to < index, use to = slides.length + to
                // if going backward but to > index, use to = -slides.length + to
                if (direction !== natural_direction) to =  -direction * slides.length + to;
            }
            var diff = Math.abs(index-to) - 1;
            // move all the slides between index and to in the right direction
            while (diff--)
            {
                move( circle((to > index ? to : index) - diff - 1), width * direction, 0);
            }
            to = circle(to);
            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);
            if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place
        }
        else
        {
            to = circle(to);
            animate(index * -width, to * -width, slideSpeed || speed);
        }

        index = to;

        finalHandle(index) ;

        offloadFn(options.callback && options.callback(index, slides[index]));
    }

    function prev()
    {
        if (options.continuous) slide(index-1);
        else if (index) slide(index-1);
    }

    function next()
    {
        if (options.continuous) slide(index+1);
        else if (index < slides.length - 1) slide(index+1);
    }

    function move(index, dist, speed)
    {
        if ( index < 0 ) return ;
        translate(index, dist, speed);
        slidePos[index] = dist;
    }

    function translate(index, dist, speed)
    {
        var slide = $(slides).eq(index);

        $(slide).css('webkitTransitionDuration', speed + 'ms') ;
        $(slide).css('MozTransitionDuration', speed + 'ms') ;
        $(slide).css('msTransitionDuration', speed + 'ms') ;
        $(slide).css('OTransitionDuration', speed + 'ms') ;
        $(slide).css('transitionDuration', speed + 'ms') ;

        $(slide).css('webkitTransform', 'translate(' + dist + 'px,0)' + ' translateZ(0)' ) ;
        $(slide).css('msTransform', 'translateX(' + dist + 'px)' ) ;
        $(slide).css('MozTransform', 'translateX(' + dist + 'px)' ) ;
        $(slide).css('OTransform', 'translateX(' + dist + 'px)' ) ;
    }

    function animate(from, to, speed)
    {
        $(element).animate ( { left:to}, speed||0 ) ;
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
    }

    function circle(index)
    {
        // a simple positive modulo using slides.length
        return ($(slides).length + (index % $(slides).length)) % $(slides).length;
    }

    setup() ;

    if (options.auto) begin();

    $( element ).on({
        touchstart: function(event) {
            if (options.stopPropagation) event.stopPropagation();            
            startHandle ( event );
        },
        touchend: function(event) {
            if (options.stopPropagation) event.stopPropagation();            
            endHandle ( event );
            begin();
        },
        touchmove: function(event) {
            if (options.stopPropagation) event.stopPropagation();            
           moveHandle ( event );
        },
        transitionend: function(event) {
            transitionendHandle ( event )  ;
        }
    });

    $(window).on({
        resize: function() {
           setup();
        }
    });


    function keyupHandle ( event )
    {
        if ( event.which == 39 ) next()  ;
        else if ( event.which == 37 ) prev()  ;
    }

    function startHandle ( event )
    {
        offloadFn(options.prepare && options.prepare(index, slides[index]));

        try
        {
            var touches = event.originalEvent.changedTouches[0] ;
        } catch (e) {
            var touches = event ;
            if ( touches.which == 1  &&  touches.button == 0 ){}
            else return;
        }

        // measure start values
        start = {
            // get initial touch coords
            x: touches.pageX,
            y: touches.pageY,
            // store time to determine touch duration
            time: +new Date
        };

        // used for testing first move event
        isScrolling = undefined;

        // reset delta and end measurements
        delta = {};
    }


    function moveHandle ( event )
    {
        try
        {
            var touches = event.originalEvent.changedTouches[0] ;
        } catch (e) {
            var touches = event ;
            if ( touches.which == 1  &&  touches.button == 0 ){}
            else return;
        }

        // ensure swiping with one touch and not pinching
        if ( touches.length > 1 || event.scale && event.scale !== 1) return
        if (options.disableScroll) event.preventDefault();

        // measure change in x and y
        delta = {
            x: touches.pageX - start.x,
            y: touches.pageY - start.y
        }

        // determine if scrolling test has run - one time test
        if ( typeof isScrolling == 'undefined')
        {
            isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
        }

        // if user is not trying to scroll vertically
        if (!isScrolling)
        {
            // prevent native scrolling
            event.preventDefault();

            // stop slideshow
            stop();

            // increase resistance if first or last slide
            if (options.continuous)
            { // we don't add resistance at the end
                translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
                translate(index, delta.x + slidePos[index], 0);
                translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);
            }
            else
            {
                delta.x =
                    delta.x /
                      ( (!index && delta.x > 0               // if first slide and sliding left
                        || index == slides.length - 1        // or if last slide and sliding right
                        && delta.x < 0                       // and if sliding at all
                      ) ?
                      ( Math.abs(delta.x) / width + 1 )      // determine resistance level
                      : 1 );                                 // no resistance if false

                // translate 1:1
                translate(index-1, delta.x + slidePos[index-1], 0);
                translate(index, delta.x + slidePos[index], 0);
                translate(index+1, delta.x + slidePos[index+1], 0);
            }
        }
    }
    function endHandle ( event )
    {
        try
        {
            var touches = event.originalEvent.changedTouches[0] ;
        } catch (e) {
            var touches = event ;
            if ( touches.which == 1  &&  touches.button == 0 ){}
            else return;
        }

        // measure duration
        var duration = +new Date - start.time;

        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
            Number(duration) < 250               // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        var isPastBounds =
            !index && delta.x > 0                            // if first slide and slide amt is greater than 0
            || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

        if (options.continuous) isPastBounds = false;

        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // if not scrolling vertically
        if (!isScrolling)
        {
            if (isValidSlide && !isPastBounds)
            {
                if (direction)
                {
                    if (options.continuous)
                    { // we need to get the next in this direction in place
                        move(circle(index-1), -width, 0);
                        move(circle(index+2), width, 0);
                    }
                    else
                    {
                        move(index-1, -width, 0);
                    }
                    move(index, slidePos[index]-width, speed);
                    move(circle(index+1), slidePos[circle(index+1)]-width, speed);
                    index = circle(index+1);
                }
                else
                {
                    if (options.continuous)
                    { // we need to get the next in this direction in place
                        move(circle(index+1), width, 0);
                        move(circle(index-2), -width, 0);

                    }
                    else
                    {
                        move(index+1, width, 0);
                    }

                    move(index, slidePos[index]+width, speed);
                    move(circle(index-1), slidePos[circle(index-1)]+width, speed);
                    index = circle(index-1);
                }
                options.callback && options.callback(index, slides[index]);
            }
            else
            {
                if (options.continuous)
                {
                    move(circle(index-1), -width, speed);
                    move(index, 0, speed);
                    move(circle(index+1), width, speed);
                }
                else
                {
                    move(index-1, -width, speed);
                    move(index, 0, speed);
                    move(index+1, width, speed);
                }
            }
            finalHandle(index) ;
        }
    }

    function transitionendHandle (event)
    {
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
    }

    function finalHandle ( position, msg)
    {
        if (options.continuous)
        {
            getHtml(circle(position));
            getHtml(circle(position-1));
            getHtml(circle(position+1));
        }
        else
        {
            getHtml(position);
            getHtml(position-1);
            getHtml(position+1);
        }

        if ( fittable )
        {
            var pannelHeight = $(slides).eq(index).height() ;
            $(container).height(pannelHeight+fittablemargin) ;
        }

        if ( options.cookie ) $.cookie( 'swipe' + $(container).attr('id'), position, { expires: 1} );
    }

    function getHtml ( position )
    {

        if ( position > -1 && position < $(slides).length && $.trim(slides.eq(position).html()) == 'blank' && options.datas[position] )
        {
            //if (browser.transitions) console.log  ( position ) ;
            $(slides).eq(position).html ( "<div style='display:block;width:100%;text-align:center;padding:10px 0;'><img src='http://image.donga.com/donga/img/loading5.gif'></div>") ;
            $.ajax({
                type : 'GET' ,
                url : options.datas[position],
                dataType : 'html' ,
                error : function(result) { alert ( 'error') } ,
                success : function(result) {
                    $(slides).eq(position).html (result) ;

                    if ( fittable )
                    {
                        var pannelHeight = $(slides).eq(index).height() ;
                        $(container).height(pannelHeight+fittablemargin) ;
                    }
                    options.callbackRequest && options.callbackRequest(  index,  position, slides[position]);
                }
            });
        }
    }

    function setHtml ( position, html )
    {
        $(slides).eq(position).html(html) ;
        if ( fittable )
        {
            var pannelHeight = $(slides).eq(index).height() ;
            $(container).height(pannelHeight+fittablemargin) ;
        }

    }

    function appendHtml ( position, html )
    {
        $(slides).eq(position).append(html) ;
        if ( fittable )
        {
            var pannelHeight = $(slides).eq(index).height() ;
            $(container).height(pannelHeight+fittablemargin) ;
        }

    }


    // expose the Swipe API
    return {
        setup: function() {
            setup();
        },
        slide: function(to, speed) {
            // cancel slideshow
            stop();
            slide(to, speed);
            return false;
        },
        prev: function() {
        // cancel slideshow
            stop();
            prev();
            return false;
        },
        next: function() {
            // cancel slideshow
            stop();
            next();
            return false;
        },
        stop: function() {
            // cancel slideshow
            stop();
            return false;
        },
        begin: function() {
            // cancel slideshow
            begin();
            return false;
        },
        getPos: function() {
            // return current index position
            return index;
        },
        getNumSlides: function() {
            // return total number of slides
            return length;
        },
        circle: function(pos) {
            // a simple positive modulo using slides.length
            return circle(pos) ;
        },
        getHtml: function(pos) {
            return slides.eq(pos).html() ;
        },
        setHtml: function(pos, html) {
            setHtml(pos,html) ;
            return false;
        },
        appendHtml: function(pos, html) {
            appendHtml(pos,html) ;
            return false;
        }
    }
}