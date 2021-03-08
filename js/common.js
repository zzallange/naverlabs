$(document).ready(function(){
    //footer
    $('.btn_site').click(function(){
        $(this).toggleClass('on');    
        $('.site_link').toggleClass('active');
    });
    //mobile_GNB
    $('.m_allmenu').click(function(){
        $('.gnb').addClass('on');    
    });
    $('.btn_close').click(function(){
        $('.gnb').removeClass('on');    
    });
    //btn_top
    $('.btn_top').click(function(){
        $('html,body').animate({scrollTop: 0}, 300);
    });

    
    
});//end
