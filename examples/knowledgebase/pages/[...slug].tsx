import React from "react";
import type { NextPage, GetStaticProps, GetStaticPaths } from "next";
import type { ParsedUrlQuery } from "querystring";

import { useRouter } from "next/router";
import ErrorPage from "next/error";
import Head from "next/head";
import { PropsContextProvider } from "../components/PropsTable";

import { getPropsMetadata } from "../utils/propsMeta";
import { getToCFromContentful } from "../utils/tableOfContents";
import { FrontMatterContextProvider } from "../utils/frontMatterContext";
import type { PageContentProps } from "../components/PageContent";
import { PageContent } from "../components/PageContent";
import { getAllArticles, getSingleArticleBySlug } from "../lib/api";

interface ComponentPageProps extends PageContentProps {
  propsMetadata?: ReturnType<typeof getPropsMetadata>;
}

const ComponentPage: NextPage<ComponentPageProps> = ({
  frontMatter,
  headings,
  propsMetadata = {},
  source,
}: ComponentPageProps) => {
  const router = useRouter();

  if (router.isFallback) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <Head>
        <title>{frontMatter.title}</title>
      </Head>

      <PropsContextProvider value={{ ...propsMetadata }}>
        <FrontMatterContextProvider value={frontMatter}>
          <PageContent
            frontMatter={frontMatter}
            headings={headings}
            source={source}
          />
        </FrontMatterContextProvider>
      </PropsContextProvider>
    </>
  );
};

interface Params extends ParsedUrlQuery {
  slug: string[];
}

export const getStaticProps: GetStaticProps<
  ComponentPageProps,
  Params
> = async (context) => {
  const entrySlug = context.params?.slug[context.params?.slug.length - 1];
  const contentfulResult = await getSingleArticleBySlug(entrySlug);

  if (!contentfulResult) {
    throw new Error(
      "Could not find an entry in Contentful for: " + context.params?.slug
    );
  }

  return {
    props: {
      headings: getToCFromContentful(contentfulResult.body.json.content),
      frontMatter: {
        title: contentfulResult.title,
      },
      source: {
        richTextBody: contentfulResult.body.json,
        richTextLinks: contentfulResult.body.links,
      },
    },
  };
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const allArticles = await getAllArticles();

  // Getting all the paths based on the data from Contentful
  const contentfulPaths = allArticles.map((item) => {
    const slug = [item.kbAppCategory.slug, item.slug];
    return {
      params: {
        slug,
      },
    };
  });

  return {
    paths: contentfulPaths,
    fallback: false,
  };
};

export default ComponentPage;
