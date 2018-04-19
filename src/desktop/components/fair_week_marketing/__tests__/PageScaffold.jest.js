import React from 'react'
import { extend, cloneDeep } from 'lodash'
import { mount } from 'enzyme'
import { FairWeekPageScaffold } from '../PageScaffold'
import Fixture from 'desktop/apps/armory_week/fixture.json'

describe('FairWeekPageScaffold', () => {
  const getWrapper = (data = {}) => {
    const props = extend(cloneDeep(Fixture), data)

    return mount(<FairWeekPageScaffold {...props} />)
  }

  describe('introduction', () => {
    xit('renders title, image, description', () => {
      const introduction = extend(cloneDeep(Fixture.introduction), {
        image: 'http://image.jpg',
      })
      const component = getWrapper({ introduction })

      expect(component.text()).toMatch(introduction.title.replace('<br />', ''))
      expect(component.text()).toMatch(introduction.description)
      expect(component.html()).toMatch(introduction.image)
    })
  })

  describe('fair_coverage', () => {
    xit('Renders a list of fairs', () => {
      const component = getWrapper()
      const { fair_coverage: { fairs } } = Fixture

      expect(component.html()).toMatch(fairs[0].logo_url)
      expect(component.html()).toMatch(fairs[0].site_url)
      expect(component.html()).toMatch(fairs[1].logo_url)
      expect(component.html()).toMatch(fairs[2].logo_url)
    })
  })

  describe('event', () => {
    xit('renders title, image, description', () => {
      const component = getWrapper()
      const { event } = Fixture

      expect(component.text()).toMatch(event.title)
      expect(component.text()).toMatch(event.description)
      expect(component.html()).toMatch(event.banner_image_url)
    })
  })

  describe('prepare_for_fairs', () => {
    xit('Renders title', () => {
      const component = getWrapper()
      expect(component.html()).toMatch(Fixture.prepare_for_fairs.title)
    })

    xit('Renders related articles', () => {
      const component = getWrapper()
      const article = Fixture.prepare_for_fairs.articles[1]

      expect(component.text()).toMatch(article.title)
      expect(component.text()).toMatch(article.author)
      expect(component.html()).toMatch('2FvClMRePyeu9nCashzAgEeA') // image_url
      expect(component.html()).toMatch(article.article_url)
    })
  })

  describe('displayStickyFooter', () => {
    xit('renders sticky footer if props displayStickyFooter', () => {
      const component = getWrapper({ displayStickyFooter: true })
      expect(component.html()).toMatch('react-root-for-cta')
    })

    xit('does not render sticky footer unless displayStickyFooter', () => {
      const component = getWrapper()
      expect(component.html()).not.toMatch('react-root-for-cta')
    })
  })
})