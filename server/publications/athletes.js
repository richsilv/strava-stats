Meteor.publish('athletes', club => {
  check(club, Number)
  return Athletes.find({ club })
})
