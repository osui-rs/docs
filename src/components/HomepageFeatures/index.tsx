import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    image: '/img/osui.png',
    description: (
      <>
        With RSX, and CSS, You can easily express your imagination.
      </>
    ),
  },
  {
    title: 'Efficient',
    image: '/img/osui.png',
    description: (
      <>
        OSUI only renders when needs to, and rebuilds if necessary.
      </>
    ),
  },
  {
    title: 'Powered by Crossterm',
    image: '/img/osui.png',
    description: (
      <>
        Events and console output are powered by Crossterm.
      </>
    ),
  },
];

function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {/* <img className={styles.featureSvg} src={image} /> */}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
