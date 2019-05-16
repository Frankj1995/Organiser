var deleteBtn = document.getElementsByClassName('delete-btn');

for (i = 0; i < deleteBtn.length; i++) {
  deleteBtn[i].addEventListener('click', function(e) {
    document.querySelector('.cc-modal').style.display = 'flex';
  });
}

document.querySelector('.close').addEventListener('click', function() {

  document.querySelector('.cc-modal').style.display = 'none';
});
