Template.home.onCreated(function () {
  this.subscribe('clubs', () => {
    Clubs.find().forEach(club => {
      this.subscribe('athletes', club.id)
    })
  })
})
