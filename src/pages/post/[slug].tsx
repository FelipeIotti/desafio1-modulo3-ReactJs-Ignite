import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

 export default function Post({post}:PostProps) {
  const formatedData = format(new Date(post.first_publication_date), "dd MMM yyyy", {
      locale: ptBR
    })

    const router = useRouter();

    if (router.isFallback) {
      return <h1>Carregando...</h1>;
    }

    const totalWords = post.data.content.reduce((total, contentItem) => {
      total += contentItem.heading.split(' ').length;

      const words = contentItem.body.map(item => item.text.split(' ').length);
      words.map(word => (total += word));
      return total;
    }, 0);
    const readTime = Math.ceil(totalWords / 200);

  return(
    <>
    <Header/>
    <img src={post.data.banner.url} alt={post.data.banner.url} className={styles.img}/>
    <main className={styles.container} >
      <article className={styles.post} >
      <h1>{post.data.title}</h1>
      <div className={styles.infos} >
        <FiCalendar/>
        <time>{formatedData}</time>
        <FiUser/>
        <p>{post.data.author}</p>
        <FiClock/>
        <time>{`${readTime} min`}</time>
      </div>
        {post.data.content.map(content => {
          return (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          );
        })}
      </article>
    </main>
    </>
  );
 }

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};


export const getStaticProps: GetStaticProps  = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts',String(context.params.slug), {
    ref: context.previewData?.ref || null
  }
  );
  //console.log(response.data);

  const posts = {
      subtitle: response.data.subtitle,
      title: response.data.title,
      banner:{
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    };


  const post = {
    // first_publication_date: new Date(response.first_publication_date).toLocaleDateString('pt-BR',{
    //   day: '2-digit',
    //   month: 'short',
    //   year: 'numeric',
    // }),
    // first_publication_date : format(new Date(response.first_publication_date), "dd MMM yyyy", {
    //   locale: ptBR
    // }),
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: posts,
  };

  return {
    props: {post},
  };
};

