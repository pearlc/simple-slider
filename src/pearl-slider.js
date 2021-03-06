/**
 * Created by rchung on 2014. 2. 16..
 */

/**
 *
 * deltegate 는 페이징 번호를 위한 기능인가? 아니면 selectedItemView 를 위한 기능인가? 둘다 가능한가? 즉 둘중 하나를 선택해야하는가?
 * <- pagination 이 있는데 delegate 까지 굳이 있어야 하는 경우는 없을듯. selectedItemView 로 연결하도록 변경
 *
 * Modle 을 분리 시켜서 직접 html inject 를 하는것이 옳은지 고민해볼것. 이래야 사용자 입장에서 일할 거리가 적어짐..
 * (경우에 따라서는 더 많아짐. 지금 생각해볼때 가장 문제가 되는 부분은 자동으로 element inject를 하게 된다면 이런 element 등의 이벤트 캐치를 할수 있는 방법이 마땅치 않으므로
 *  callback 함수 등을 custom 할수있는 법을 마련해줘야 할듯)
 *
 *
 * TODO : 수정 우선순위
 * itemSelector 는 itemContainerSelector 안에서 찾는데 delegateItem은 delegateList 안에서 찾지 않음. 이거 통일 시켜야 할듯. (delegateList, itemContainer <- 이 이름에 대해서도 고민해볼것)
 * delegate 에도 selectedItem 효과 적용
 * 번호 선택시 selectedItemView 컨텐츠 변경하는 기능 추가 (이걸 어떻게 결합시킬것인지 고민해야함) <- delegate 랑도 연관 있을듯
 * indexItemView 의 Fade In/Out 효과 적용도 옵션으로 추가.
 * 아이템 직접 눌렀을때 selectedItemView 변경
 * autoSlide
 * gulp 와의 연동 깔끔하게 바꿀것 (버전명이라든지.. 이런것을 고려해서 배포 자동화 하려면 어떻게 해야하는가?)
 * setCurrentPage 등의 함수들의 edge 값 검사후 제한 값 넘어가지 않도록 확실히 제한.
 * 각 elements 들의 default 값들이 reasonable 한지 따져볼것
 * 오류처리 : 절대 두개가 되면 안되는 것들에 대해 select 후 적절한 오류메시지 출력 (예를들면 itemContainerSelector 를 가져와 보니 두개 이상이라던가.. 이런 경우)
 * 현재는 index 패널이 img에만 특화되어 있는데, 이걸 div 같은 태그로 일반화 시킬것. callback 함수 등록 기능 추가
 * selectedItemView 기능 추가 (아이템 눌렀을때 selectedItem 변경시키는 기능)
 * 좌우 버튼 눌렀을때 selectedItemView 변경 <- 이게 필요한 경우가 있는가? 옵션으로
 * 콜백 커스터마이징시 인자명을 components 말고 slider 로 바꾸는게 더 직관적이지 않나?
 * 모든 이벤트 핸들러는 유저가 덮어쓸수 있도록 할것
 * 초기화 직후에 유저가 호출할수 있는 callback 함수 전달받을수 있게 할것
 * 이미지의 z-index로 인해서 그 위에 올라가 있는 delegate 들이 밑으로 감춰짐. 이거 어찌 해결할까
 *
 *
 */

// Utility for creating objects in older browsers
if (typeof Object.create !== 'function') {
    Object.create = function (obj) {
        'use strict';
        function F() {}
        F.prototype = obj;
        return new F();
    };
}

(function ($, window, document, undefined) {
    'use strict';
    $.fn.simpleSlider = function (options) {
        return this.each(function () {

            var slider = Object.create(Slider);
            slider.init(options, this);

        });
    };

    $.fn.simpleSlider.options = {

        // 구성 요소들
        itemContainerSelector: "ul:first",    // 슬라이드들을 감사고 있는 container. 이 element의 margin-left를 변경시키는 방법으로 노출될 아이템들이 결정됨
        itemSelector: "li",     // 슬라이드 대상이 되는 아이템들
        prevButtonSelector: ".prev",    // "이전" 버튼
        nextButtonSelector: ".next",    // "다음" 버튼
        selectedItemViewSelector: ".selected-item-view", // 선택된 아이템들을 크게 보여주는 panel (아직 완전히 구현되지 않았음)
        delegatesListSelector: ".delegates-list",   // 넘버링 ui의 z-index 를 적용하기 위해서는 존재해야함.
        delegatesItemSelector: ".delegates-item",   // 각 아이템의 넘버링 (클릭시 index 를 해당 delegates의 번호에 맞게 변경 해주는 역할)

        // auto slide 기능 : 아직 구현되지 않았음 (selectedItem 을 바꾸는 오토 슬라이드? 아니면 페이징 오토 슬라이드?)
        autoSlide: false,
        autoSliderDirection: 'right',
        autoSlideInterval: 7000,
        autoSlideControls: false,
        autoSlideStartText: 'Start',
        autoSlideStopText: 'Stop',
        autoSlideStopWhenClicked: true,

        continuous: true,   // 슬라이드가 끝에 도달했을때, 제일 처음으로 이어질건지 결정하는 flag

        slideEaseDuration: 500,
        slideEaseFunction: "swing",  // 'swing', 'fade', easeInOutExpo

        // 목록의 Pagination 관련 옵션
        itemCountPerPage: 4, // 한 페이지당 노출될 아이템 개수
        pageMode: true,     //  페이지 모드

        // callback
        itemSelectCallback: null,


        // caching
        selectedItem: null,
        selectedItemIndex: 0
    };

    var Slider = {

        init: function (options, elem) {
            var self = this,
                standardItemIndex,
                $standardItem;

            self.options = $.extend({}, $.fn.simpleSlider.options, options);

            self.bindComponents(elem);

            // 슬라이드 아이템들
            self.itemCount = self.components.items.length;

            // 아이템 너비 획득
            if (self.itemCount > 0) {
                if (self.itemCount > 1) {
                    standardItemIndex = 1;
                } else {
                    standardItemIndex = 0;
                }

                $standardItem = $(self.components.items[standardItemIndex]);

                self.itemElementWidth = parseInt($standardItem.css('margin-left').replace('px', ''), 10) + parseInt($standardItem.css('margin-right').replace('px', ''), 10) + $standardItem.width();
            }

            if (self.options.pageMode === true) {
                self.lastPage = Math.max(1, parseInt((self.itemCount - 1) / self.options.itemCountPerPage, 10) + 1);
            }

            self.registerEventHandlers();

            self.setStartStatus();

            if (self.options.autoSlide === true) {
                self.autoSlide();
            }
        },

        bindComponents: function (elem) {
            var self = this;

            self.components = {};
            self.components.slider = $(elem);   // 콜백 함수들에 slider 인자를 전달하기 위해 사용 <- 맞나?
            self.components.itemContainer = $(elem).find(self.options.itemContainerSelector);
            self.components.items = self.components.itemContainer.find(self.options.itemSelector);
            self.components.selectedItemView = $(elem).find(self.options.selectedItemViewSelector);
            self.components.prevButton = $(elem).find(self.options.prevButtonSelector);
            self.components.nextButton = $(elem).find(self.options.nextButtonSelector);
            self.components.delegatesList = $(elem).find(self.options.delegatesListSelector);
            self.components.delegatesItems = $(elem).find(self.options.delegatesItemSelector);
        },

        registerEventHandlers: function () {

            var self = this;

            if (self.components.prevButton.length > 0) {
                self.components.prevButton.on('click', {slider: self}, self.prevPressedEventHandler);
            }

            if (self.components.nextButton.length > 0) {
                self.components.nextButton.on('click', {slider: self}, self.nextPressedEventHandler);
            }

            if (self.components.items.length > 0) {
                self.components.items.on('click', {slider: self}, self.itemPressedEventHandler);
            }

            if (self.components.delegatesItems.length > 0) {
                self.components.delegatesItems.on('click', {slider: self}, self.delegatesItemPressedEventHandler);
            }
        },

        selectItem: function (item) {
            window.console.log(item);
        },

        selectItemIndex: function (index) {
            window.console.log(index);
        },

        setCurrentItem: function () {

            // TODO : 미완성, selectedItemView 있을때만 호출되는 메서드
            var self = this;

            self.transition();
        },

        setCurrentPage: function (page) {
            var self = this;

            // TODO : page 값 범위 안에 있는지 검사

            if (self.currentPage !== page) {
                self.currentPage = page;
                self.transition();
            }
        },

        setCurrentItemIndex: function (itemIndex) {
            var self = this;

            if (itemIndex < 0 || itemIndex >= self.components.items.length) {
                itemIndex = 0;
            }

            if (self.currentItemIndex !== itemIndex) {
                self.currentItemIndex = itemIndex;
                self.transition();
            }
        },

        moveToNextPage: function () {

            var self = this,
                nextPage = self.currentPage;

            if (self.currentPage + 1 <= self.lastPage) {

                nextPage = self.currentPage + 1;

            } else {

                if (self.options.continuous === true) {
                    nextPage = 1;
                } else {
                    // nextPage 변경하지 않음
                    window.console.log(nextPage);
                }
            }
            self.setCurrentPage(nextPage);
        },

        moveToPrevPage: function () {

            var self = this,
                prevPage = self.currentPage;

            if (self.currentPage - 1 >= 1) {
                prevPage = self.currentPage - 1;
            } else {

                if (self.options.continuous === true) {
                    prevPage = self.lastPage;
                } else {
                    // prevPage 변경하지 않음
                    window.console.log(prevPage);
                }
            }

            self.setCurrentPage(prevPage);
        },

        moveToNextItem: function () {
            var self = this,
                nextItemIndex = self.currentItemIndex + 1;

            if (nextItemIndex >= (self.itemCount - self.options.itemCountPerPage + 1)) {
                nextItemIndex = 0;
            }

            self.setCurrentItemIndex(nextItemIndex);
        },

        moveToPrevItem: function () {
            var self = this,
                prevItemIndex = self.currentItemIndex - 1;

            if (prevItemIndex < 0) {
                prevItemIndex = self.itemCount - (self.options.itemCountPerPage);
            }

            self.setCurrentItemIndex(prevItemIndex);
        },


        transition: function () {

            var self = this;

            if (self.options.pageMode === true) {
                self.marginLeft = -((self.currentPage - 1) * self.options.itemCountPerPage * self.itemElementWidth);
            } else {
                self.marginLeft = -(self.currentItemIndex * self.itemElementWidth);
            }

            // Animate the slider

            switch (self.options.slideEaseFunction) {
            case 'swing':
                (self.components.itemContainer).animate({
                    'margin-left': self.marginLeft + 'px'
                }, {
                    easing: self.options.slideEaseFunction,
                    duration: self.options.slideEaseDuration,
                    queue: false
                });
                break;

            case 'fade':
                var currentItem,
                    itemToBeUnchosen,
                    currentItemDelegate;

                self.components.items.each(function (index, elem) {
                    var zIndex;

                    if ($(elem).css('opacity') === '1') {
                        itemToBeUnchosen = $(elem);
                        itemToBeUnchosen.css('z-index', 20);
                    } else {
                        zIndex = $(elem).css('z-index');
                        $(elem).css('z-index', --zIndex);
                    }
                });

                currentItem = $(self.components.items[self.currentItemIndex]);
                currentItem.css('display', 'block');
                currentItem.css('opacity', 1);

                // delegate item css
                if (self.components.delegatesItems.length > 0) {
                    currentItemDelegate = $(self.components.delegatesItems[self.currentItemIndex]);
                    self.components.delegatesItems.removeClass('on');   // TODO : 클라스 이름도 옵션에서 설정 가능하도록 할것 (그 전에 그게 최선인가 고민해볼것)
                    currentItemDelegate.addClass('on');
                }

                itemToBeUnchosen.animate({
                    opacity: 0
                }, self.options.slideEaseDuration, function () {
                    $(this).css('display', 'none');
                });
                break;

            default:
                window.console.log('올바르지 않은 slideEaseFunction');
                break;
            }

        },

        setStartStatus: function () {

            var self = this;

            // 초기 스타일 설정
            // TODO : 일반화 시켜야함. 현재는 fadein/out 만 고려됨
            if (self.options.slideEaseFunction === "fade") {
                if (self.components.items.length > 0) {
                    self.components.items.css('display', 'none').css('opacity', 0).css('z-index', 20).css('position', 'absolute');
                    self.components.items.first().css('display', 'block').css('opacity', 1);
                }

                // TODO : 좀더 좋은 방법 없는지 고민
                if (self.components.delegatesList.length > 0) {
                    self.components.delegatesList.css('z-index', 21);
                }
            }

            // selectedItemView 초기화


            // 초기 선택 페이지 초기화 : 리팩토링 필요
            if (self.options.pageMode === true) {
                self.currentPage = 1;   // 이렇게 쓰는게 옳은가? setCurrentPage() 를 호출하는게 낫지 않은가? : 만약 그렇다면 함수 호출시 발동되는 animation 효과 없애야함.
                //self.setCurrentPage(1); // 페이지는 1부터 시작
            }
            self.currentItemIndex = 0;   // 이렇게 쓰는게 옳은가? setCurrentItemIndex() 를 호출하는게 낫지 않은가? : 만약 그렇다면 함수 호출시 발동되는 animation 효과 없애야함.
            //self.setCurrentItemIndex(0);    // index는 0부터 시작

            if (self.components.delegatesItems.length > 0) {
                $(self.components.delegatesItems[0]).addClass('on');
            }
        },

        autoSlide: function () {
            var self = this;

            // 오토슬라이드 주기가 애니메이션 전환시간보다 길수 없음
            if (self.options.autoSlideInterval < self.options.slideEaseDuration) {
                self.options.autoSlideInterval = self.options.slideEaseDuration;
            }

            // TODO : 현재는 items 만 적용중. 추후 selectedItemView 에도 오토 슬라이드 기능 적용되도록 할것 (타임아웃되면 selectedItemView 도 바뀌도록)
            self.autoSlideTimeout = setTimeout(function () {
                var currentItemIndex = self.currentItemIndex;

                // TODO : nextItemIndex 구하는 함수를 명시적으로 호출하는게 더 좋을듯.
                self.setCurrentItemIndex(currentItemIndex + 1);
                self.autoSlide();
            }, self.options.autoSlideInterval);
        },



        // EventHandlers
        prevPressedEventHandler: function (event) {
            var slider = event.data.slider;

            if (slider.options.pageMode === true) {
                slider.moveToPrevPage();
            } else {
                slider.moveToPrevItem();
            }
        },

        nextPressedEventHandler: function (event) {
            var slider = event.data.slider;

            if (slider.options.pageMode === true) {
                slider.moveToNextPage();
            } else {
                slider.moveToNextItem();
            }
        },

        itemPressedEventHandler: function (event) {
            var slider = event.data.slider,
                imgUrl;

            // selectedItemView 가 있는 경우, 해당 아이템을 변경시킴
            // TODO : 리팩토링 필요. api 사용자 입장에서 데이터가 위치한 곳을 좀더 명확하게 정의할것.
            if (slider.components.selectedItemView.length > 0) {
                if ($(this).find('img').attr('src') !== undefined) {
                    imgUrl = $(this).find('img').attr('src');
                } else if ($(this).find('a').data('img-url') !== undefined) {
                    imgUrl = $(this).find('a').data('img-url');
                }
                slider.components.selectedItemView.find('img').attr('src', imgUrl);

//                slider.components.selectedItemView.find('img').fadeOut(200, function () {
//                    slider.components.selectedItemView.find('img').attr('src', imgUrl);
//                }).fadeIn(200);

                return false;
            }

            // 이하 selectedItemView가 없는경우, (예를들면, 각 item 의 a 태그에 href가 걸려있는 경우.. 등

        },

        delegatesItemPressedEventHandler: function (event) {
            // TODO: 현재는 fadein/out 에 특화되어 있음. 일반화 시켜야함
            var slider = event.data.slider,
                that = this,
                i = 0;

            if (slider.components.delegatesItems.length > 0) {
                $.each(slider.components.delegatesItems, function () {
                    if (that === this) {
                        slider.setCurrentItemIndex(i);
                        return false;
                    }
                    i++;
                });
                return false;

            }
        }
    };

}) (jQuery, window, document);
