var filterSelector = $('#filter');
var renderPage = function (bolosPerPage, visibleNumbers) {
    var filterValue = filterSelector.find("option:selected").val();
    var listOfBoloThumbnails = $('.thumbnail');
    var boloDiv = $('#bolo-list');
    var pagingDiv = $('#bolo-paging');
    var archivedBolos = $('#input').val() === 'archived';
    $.ajax({
        url: '/bolo/list', type: 'GET',
        data: {filter: filterValue, archived: archivedBolos},
        success: function (response) {
            if (!response) {
                boloDiv.empty();
                $('#purge').hide();
                boloDiv.append('<p class="text-success" style="font-size: xx-large">No Archived Bolos</p>');
            } else {
                $('#purge').show();
                boloDiv.empty();
                boloDiv.append(response);
                boloDiv.children().hide();
                boloDiv.children().slice(0, bolosPerPage).show();
                $(function () {
                    pagingDiv.twbsPagination({
                        totalPages: listOfBoloThumbnails.length <= bolosPerPage ?
                            1 : Math.floor(listOfBoloThumbnails.length / bolosPerPage),
                        visiblePages: visibleNumbers,
                        prev: '&laquo;',
                        next: '&raquo;',
                        onPageClick: function (event, page) {
                            boloDiv.children().hide();
                            var start = (page - 1) * bolosPerPage;
                            var end = start + bolosPerPage;
                            boloDiv.children().slice(start, end).show();
                        }
                    });
                });
            }
        }
    })
};
$(document).ready(function () {
    renderPage(12, 8);
});
//When you change the filter, render the selected bolos, and the paging
filterSelector.change(function () {
    renderPage(12, 8);
});