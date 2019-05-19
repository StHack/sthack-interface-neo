loadImages(function () {
  $('#rules').draggable({
    cursor: 'crosshair', handle: '.titleBar', drag: function (event, ui) {
      if (ui.position.top < $('#navbar').height()) {
        ui.position.top = $('#navbar').height();
      }
      if (ui.position.left < 0) {
        ui.position.left = 0;
      }
    }
  });

  $('#rules').resizable();

  loadTask(document.getElementById('easy'));
  loadTask(document.getElementById('medium'));
  loadTask(document.getElementById('hard'));
});
