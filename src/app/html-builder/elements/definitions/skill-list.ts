import {ArchitectElement} from '../architect-element';
import {hasClass} from '../../utils/has-class';

const template = `<div class="row skills-list">
<div class="col-md-4">
    <div>
      <img src="http://lorempixel.com/200/200/abstract/1/" alt="Texto Alternativo" class="img-circle img-thumbnail">
      <h2>Webdesigner</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <a href="#" class="btn btn-primary" title="See more">See works »</a>
    </div>
  </div>
  <div class="col-md-4">
    <div>
      <img src="http://lorempixel.com/200/200/abstract/2/" alt="Texto Alternativo" class="img-circle img-thumbnail">
      <h2>Photographer</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <a href="#" class="btn btn-primary" title="See more">See works »</a>
    </div>
  </div>
  <div class="col-md-4">
    <div>
      <img src="http://lorempixel.com/200/200/abstract/3/" alt="Texto Alternativo" class="img-circle img-thumbnail">
      <h2>Copywriter</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
      <a href="#" class="btn btn-primary" title="See more">See works »</a>
    </div>
  </div>
</div>`;

const style = `
.skills-list {
    padding: 20px 0;
    text-align: center;
}
.skills-list > div > div{
    padding: 10px;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: 0.2s;
}
.skills-list > div:hover > div{
    margin-top: -10px;
    border: 1px solid rgb(200, 200, 200);
    box-shadow: rgba(0, 0, 0, 0.1) 0px 5px 5px 2px;
    background: rgba(200, 200, 200, 0.1);
    transition: 0.5s;
}

.skills-list > div:hover img {
    border-radius: 50%;
    -webkit-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    transform: rotate(360deg);
}
`;

export class SkillListEl extends ArchitectElement {
    name = 'skill list';
    contentCategories = ['flow'];
    html = template;
    css = style;
    allowedContent = ['flow'];
    category = 'components';
    icon = 'build';
    specificity = 3;
    hiddenClasses = ['skills-list'];
    matcher(node: HTMLElement) {
        return hasClass(node, 'skills-list');
    }
}
