FishtronDB.handle('', {
  editor : "<h3><span id=\"dyna_dynamo\">Dinamicky</span> generovaná pasáž</h3>\n\nTato část je uložena v databázi nacházející se mimo\nGithub (na <span id=\"dyna_fdb-link\"></span>) \na je editovatelná přes editor níže.\n\n<script>\n  function posunPismenka (sel) {\n    var str = $(sel).html();\n    $(sel).html( str.substr(-1)+str.substr(0,str.length-1) );\n  }\n  \n  $(function(){\n    $('#dyna_fdb-link').html(\n      $('<a>').attr('href',FishtronDB.apiURL)\n              .html(FishtronDB.apiURL));\n    \n    if (window.jobID !== undefined) {\n      clearInterval(window.jobID);\n    }\n    \n    window.jobID = setInterval(function () {\n      posunPismenka('#dyna_dynamo');  \n    },250);\n  });\n</script>",
  zobrazeni : 270,
});