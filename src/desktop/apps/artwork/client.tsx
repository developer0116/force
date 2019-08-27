import { buildClientApp } from "reaction/Artsy/Router/client"
import { routes } from "reaction/Apps/Artwork/routes"
import { data as sd } from "sharify"
import React from "react"
import ReactDOM from "react-dom"
import { enableIntercom } from "lib/intercom"
import { recordArtworkView } from "lib/components/record_artwork_view"
import { ModalType } from "@artsy/reaction/dist/Components/Authentication/Types"

const $ = require("jquery")
const mediator = require("desktop/lib/mediator.coffee")
const User = require("desktop/models/user.coffee")
const Artwork = require("desktop/models/artwork.coffee")
const ArtworkInquiry = require("desktop/models/artwork_inquiry.coffee")
const openInquiryQuestionnaireFor = require("desktop/components/inquiry_questionnaire/index.coffee")
const openAuctionBuyerPremium = require("desktop/apps/artwork/components/buyers_premium/index.coffee")
const ViewInRoomView = require("desktop/components/view_in_room/view.coffee")
const splitTest = require("desktop/components/split_test/index.coffee")

buildClientApp({
  routes,
  context: {
    user: sd.CURRENT_USER,
    mediator,
  },
})
  .then(({ ClientApp }) => {
    ReactDOM.hydrate(<ClientApp />, document.getElementById("react-root"))
  })
  .catch(error => {
    console.error(error)
  })

if (module.hot) {
  module.hot.accept()
}

const artworkSlug = location.pathname.replace(/\/artwork\//, "")
recordArtworkView(artworkSlug, sd.CURRENT_USER)

const openInquireableModal = (artworkId: string, { ask_specialist }) => {
  if (!artworkId) return
  const user = User.instantiate()
  const inquiry = new ArtworkInquiry({ notification_delay: 600 })
  const artwork = new Artwork({ id: artworkId })

  artwork.fetch().then(() => {
    openInquiryQuestionnaireFor({
      user,
      artwork,
      inquiry,
      ask_specialist,
    })
  })
}

export const handleOpenAuthModal = options => {
  mediator.trigger("open:auth", {
    mode: ModalType.signup,
    signupIntent: "signup",
    type: "signup",
    trigger: "click",
    redirectTo: location.href,
    ...options,
  })
}

const shouldViewExperiment = () => {
  return sd.INQUIRY_AUTH === "experiment" && !sd.CURRENT_USER
}

const maybeFireTestView = () => {
  !sd.CURRENT_USER && splitTest("inquiry_auth").view()
}

mediator.on("launchInquiryFlow", options => {
  // TODO: Remove after inquiry a/b test
  maybeFireTestView()
  if (shouldViewExperiment()) {
    const authOptions = {
      intent: "Contact Gallery",
      contextModule: "Artwork CTA",
      modal_copy: "Sign up to contact gallery",
      afterSignupAction: () =>
        openInquireableModal(options.artworkId, { ask_specialist: false }),
    }
    handleOpenAuthModal(authOptions)
  } else {
    openInquireableModal(options.artworkId, { ask_specialist: false })
  }
})

mediator.on("openBuyNowAskSpecialistModal", options => {
  // TODO: Remove after inquiry a/b test
  maybeFireTestView()
  if (shouldViewExperiment()) {
    const authOptions = {
      intent: "Ask a specialist",
      contextModule: "Artwork CTA",
      modal_copy: "Sign up to ask a specialist",
      afterSignupAction: () =>
        openInquireableModal(options.artworkId, { ask_specialist: true }),
    }
    handleOpenAuthModal(authOptions)
  } else {
    openInquireableModal(options.artworkId, { ask_specialist: true })
  }
})

mediator.on("openAuctionAskSpecialistModal", options => {
  // TODO: Remove after inquiry a/b test
  maybeFireTestView()
  if (shouldViewExperiment()) {
    const authOptions = {
      intent: "Ask a specialist",
      contextModule: "Artwork CTA",
      modal_copy: "Sign up to ask a specialist",
      afterSignupAction: () => openAuctionAskSpecialistModal(options),
    }
    handleOpenAuthModal(authOptions)
  } else {
    openAuctionAskSpecialistModal(options)
  }
})

const openAuctionAskSpecialistModal = options => {
  const artworkId = options.artworkId
  if (artworkId) {
    const user = User.instantiate()
    const inquiry = new ArtworkInquiry({ notification_delay: 600 })
    const artwork = new Artwork({ id: artworkId })

    artwork.fetch().then(() => {
      artwork.set("is_in_auction", true)
      openInquiryQuestionnaireFor({
        user,
        artwork,
        inquiry,
        ask_specialist: true,
      })
    })
  }
}

mediator.on("openViewInRoom", options => {
  try {
    const { dimensions } = options
    const { url, width, height } = options.image

    let newWidth = width
    let newHeight = height

    const bounds = document
      .querySelector("[data-is-default=true]")
      .getBoundingClientRect()

    const imgRatio = newWidth / newHeight
    const boundsRatio = bounds.width / bounds.height

    if (boundsRatio > imgRatio) {
      newHeight = bounds.height
      newWidth = (newHeight * width) / height
    } else if (boundsRatio < imgRatio) {
      newWidth = bounds.width
      newHeight = (height * newWidth) / width
    } else {
      newWidth = bounds.width
      newHeight = newWidth
    }

    const newLeft = (bounds.width - newWidth) / 2 + bounds.left
    const newTop = bounds.top + Math.abs(bounds.height - newHeight) / 2

    const positionStyles = {
      position: "absolute",
      top: `${newTop}px`,
      left: `${newLeft}px`,
      width: `${newWidth}px`,
      height: `${newHeight}px`,
    }

    const viewInRoom = new ViewInRoomView({
      imgSelector: "[data-type=artwork-image]",
      imgUrl: url,
      positionStyles: positionStyles,
      dimensions: dimensions.cm,
    })

    $("body").prepend(viewInRoom.render().$el)
  } catch {
    // TODO: Add some proper error handling
  }
})

mediator.on("openAuctionBuyerPremium", options => {
  openAuctionBuyerPremium(options.auctionId)
})

mediator.on("enableIntercomForBuyers", options => {
  enableIntercom(options)
})
