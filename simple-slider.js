/**
 * Created by rchung on 2014. 2. 16..
 */

/**
 *
 * 수정 우선순위
 * 이름 변경
 * 현재는 index 패널이 img에만 특화되어 있는데, 이걸 div 같은 태그로 일반화 시킬것. callback 함수 등록 기능 추가
 * selectedItem 으로 이름 변경 및 해당 기능 추가 (아이템 눌렀을때 selectedItem 변경시키는 기능)
 *
 *
 * TODO
 * 번호로 직접 접근하는 기능 추가 (이걸 어떻게 결합시킬것인지 고민해야함)
 * 좌우 버튼 눌렀을때 indexImg 변경
 * 진행중 : 아이템 직접 눌렀을때 index 변경
 * autoSlide
 */

// Utility for creating objects in older browsers
if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}

(function( $, window, document, undefined ) {

    $.fn.simpleSlider = function( options ) {
        return this.each(function() {

            var slider = Object.create( Slider );
            slider.init( options, this );

        });
    };

    $.fn.simpleSlider.options = {

        itemSelector: "li",     // 슬라이드 대상이 되는 아이템들
        itemContainerSelector: "ul",    // 슬라이드들을 감사고 있는 container. 이 element의 margin-left를 변경시키는 방법으로 노출될 아이템들이 결정됨
        prevButtonSelector: ".prev",    // "이전" 버튼
        nextButtonSelector: ".next",    // "다음" 버튼
        selectedItemViewSelector: ".selected-item-view", // 선택된 아이템들을 크게 보여주는 panel (아직 완전히 구현되지 않았음)
        itemSelectCallback: null,

        // auto slide 기능 : 아직 구현되지 않았음
        autoSlide: false,
        autoSliderDirection: 'right',
        autoSlideInterval: 7000,
        autoSlideControls: false,
        autoSlideStartText: 'Start',
        autoSlideStopText: 'Stop',
        autoSlideStopWhenClicked: true,

        continuous: true,   // 슬라이드가 끝에 도달했을때, 제일 처음으로 이어질건지 결정하는 flag

        slideEaseDuration: 500,
        slideEaseFunction: "swing",  // easeInOutExpo

        // Pagination 관련 옵션
        itemCountPerPage: 4, // 한 페이지당 노출될 아이템 개수
        pageMode: true //  페이지 모드
    };

    var Slider = {

        init: function(options, elem) {
            var self = this,
                $standardItem;

            self.options = $.extend({}, $.fn.simpleSlider.options, options);

            self.build(elem);

            self.itemCount = self.components.items.length;

            // 아이템 너비 획득
            $standardItem = $(self.components.items[1]);

            self.itemElementWidth = parseInt($standardItem.css('margin-left').replace('px', ''), 10) + parseInt($standardItem.css('margin-right').replace('px', ''), 10) + $standardItem.width();

            if (self.options.pageMode === true) {
                self.lastPage = Math.max(1, parseInt( (self.itemCount - 1) / self.options.itemCountPerPage) + 1);
            }

            self.events();
        },

        build: function(elem) {
            var self = this;

            self.components = {};
            self.components.slider = $(elem);   // 콜백 함수들에 slider 인자를 전달하기 위해 사용 <- 맞나?
            self.components.itemContainer = $(elem).find(self.options.itemContainerSelector);
            self.components.items = $(elem).find(self.options.itemSelector);
            self.components.selectedItemView = $(elem).find(self.options.selectedItemViewSelector);
            self.components.prevButton = $(elem).find(self.options.prevButtonSelector);
            self.components.nextButton = $(elem).find(self.options.nextButtonSelector);

            if (self.options.pageMode === true) {
                self.setCurrentPage(1); // 페이지는 1부터 시작
            } else {
                self.setCurrentItemIndex(0);    // index는 0부터 시작
            }
        },

        events: function() {

            var self = this;

            if (self.components.prevButton.length > 0) {

                if (self.options.pageMode === true) {

                    // 페이지 이동
                    self.components.prevButton.on({
                        click: function() {
                            self.moveToPrevPage();
                        }
                    })

                } else {

                    // 개별 이동
                    if (0) {

                        // currentIndex, currentItem 개념이 있는 경우

                    } else {

                        // currentIndex, currentItem 개념이 없는 경우
                        self.components.prevButton.on({
                            click: function() {
                                self.moveToPrevItem();
                            }
                        })

                    }
                }
            }

            if (self.components.nextButton.length > 0) {

                if (self.options.pageMode === true) {

                    // 페이지 이동
                    self.components.nextButton.on({
                        click: function() {
                            self.moveToNextPage();
                        }
                    })

                } else {

                    // 개별 이동
                    if (0) {

                        // currentIndex, currentItem 개념이 있는 경우

                    } else {

                        // currentIndex, currentItem 개념이 없는 경우
                        self.components.nextButton.on({
                            click: function() {
                                self.moveToNextItem();
                            }
                        });
                    }
                }
            }

            // 일반화 시킨후 분리할것 (콜백 함수로 replace 가능하도록 수정)
            if (self.components.selectedItemView.length > 0) {

                if (self.options.itemSelectCallback !== null) {
                    self.components.items.find("img").on({
                        click: function() {
                            self.options.itemSelectCallback(this, self.components);
                        }
                    });
                } else {

                    self.components.items.find("img").on({
                        click: function() {
                            self.components.selectedItemView.find('img').attr('src', $(this).attr('src'));
                            console.log($(this).attr('src'));
                            console.log('hi');
                        }
                    });
                }
            }
        },

        setCurrentItem: function(index) {

            // TODO : 미완성, indexImg 있을때만 호출되는 메서드
            var self = this;

            self.transition();
        },

        setCurrentPage: function(page) {
            var self = this;

            self.currentPage = page;

            self.transition();
        },

        setCurrentItemIndex: function(itemIndex) {
            var self = this;

            self.currentItemIndex = itemIndex;

            self.transition();
        },

        moveToNextPage: function() {

            var self = this,
                nextPage = self.currentPage;

            if (self.currentPage + 1 <= self.lastPage) {

                nextPage = self.currentPage + 1;

            } else {

                if (self.options.continuous === true) {
                    nextPage = 1;
                } else {
                    // nextPage 변경하지 않음
                }
            }
            self.setCurrentPage(nextPage);
        },

        moveToPrevPage: function() {

            var self = this,
                prevPage = self.currentPage;

            if (self.currentPage - 1 >= 1) {
                prevPage = self.currentPage - 1;
            } else {

                if (self.options.continuous === true) {
                    prevPage = self.lastPage;
                } else {
                    // prevPage 변경하지 않음
                }
            }

            self.setCurrentPage(prevPage);
        },

        moveToNextItem: function() {
            var self = this;

            var nextItemIndex = self.currentItemIndex + 1;

            if (nextItemIndex >= (self.itemCount - self.options.itemCountPerPage + 1)) {
                nextItemIndex = 0;
            }

            self.setCurrentItemIndex(nextItemIndex);
        },

        moveToPrevItem: function() {
            var self = this;

            var prevItemIndex = self.currentItemIndex - 1;

            if (prevItemIndex < 0) {
                prevItemIndex = self.itemCount - (self.options.itemCountPerPage);
            }

            self.setCurrentItemIndex(prevItemIndex);
        },


        transition: function() {

            var self = this;

            if (self.options.pageMode === true) {
                self.marginLeft = -((self.currentPage-1) * self.options.itemCountPerPage * self.itemElementWidth );
            } else {
                self.marginLeft = -(self.currentItemIndex * self.itemElementWidth );
            }

            // Animate the slider
            (self.components.itemContainer).animate({
                'margin-left': self.marginLeft + 'px'
            }, {
                easing: self.options.slideEaseFunction,
                duration: self.options.slideEaseDuration,
                queue: false
            });

        },

        autoSlide: function() {

        },

        getCurrentItem: function() {

        }
    }

})(jQuery, window, document);