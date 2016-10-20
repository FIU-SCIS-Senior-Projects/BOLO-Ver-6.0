window.onload = function () {
    var converter = new showdown.Converter();
    var textInputBox = document.getElementsByName('in')[0];
    var markdownArea = document.getElementById('markdown');

    var convertTextAreaToMarkdown = function () {
        var markdownText = textInputBox.value;
        markdownArea.innerHTML = converter.makeHtml(markdownText)
    };

    textInputBox.addEventListener('input', convertTextAreaToMarkdown);

    convertTextAreaToMarkdown();
};