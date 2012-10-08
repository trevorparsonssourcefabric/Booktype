/* CONFIG OPTIONS */
pagination.sectionStartMarker = 'h12';
pagination.sectionTitleMarker = 'h12';

pagination.chapterStartMarker = 'h22';
pagination.chapterTitleMarker = 'h22';

pagination.flowElement = 'document.getElementById("dokument")';

pagination.alwaysEven = false;

pagination.enableReflow = true;

pagination.enableFrontmatter = false;

pagination.bulkPagesToAdd = 50; // For larger chapters add many pages at a time so there is less time spent reflowing text
pagination.pagesToAddIncrementRatio = 1.4; // Ratio of incrementing pages. 1.4 seems to be the fastest in most situations.

pagination.frontmatterContents = '';
//pagination.frontmatterContents = '<div id="booktitle">Book title</div><div id="booksubtitle">Book subtitle</div><div id="bookeditors">ed. Editor 1, Editor II, Editor III</div><div class="pagebreak"></div><div id="copyrightpage">Copyright: You<br>License: CC</div><div class="pagebreak"></div>';

pagination.autoStart = false;

/* END CONFIG OPTIONS */
